import CircuitBreaker from 'opossum';
import { ILLMAdapter } from './llm.interface.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { MockLLMAdapter } from './mock.llm.js';

export class AnthropicLLMAdapter extends ILLMAdapter {
  constructor() {
    super();
    this.apiKey = env.ANTHROPIC_API_KEY;
    this.model = env.LLM_MODEL || 'claude-3-5-sonnet-20241022';
    this.fallbackAdapter = new MockLLMAdapter();

    // Circuit Breaker protecting against upstream Anthropic latency or service outage
    const breakerOptions = {
      timeout: 15000, // 15 seconds
      errorThresholdPercentage: 50,
      resetTimeout: 30000, // 30 seconds
    };

    this.breaker = new CircuitBreaker(this._callAnthropicApi.bind(this), breakerOptions);
    this.breaker.fallback(async (options, error) => {
      logger.warn(
        { err: error?.message },
        '[AnthropicAdapter] Circuit open or call timed out. Falling back to Mock LLM.'
      );
      return this.fallbackAdapter.generateText(options);
    });

    this.breaker.on('open', () =>
      logger.warn('[AnthropicAdapter] Circuit Breaker OPEN: Upstream calls failing')
    );
    this.breaker.on('halfOpen', () =>
      logger.info('[AnthropicAdapter] Circuit Breaker HALF-OPEN: Testing upstream health')
    );
    this.breaker.on('close', () =>
      logger.info('[AnthropicAdapter] Circuit Breaker CLOSED: Normal operation restored')
    );
  }

  async generateText({ prompt, systemPrompt = '', temperature = 0.2, maxTokens = 2048 }) {
    if (!this.apiKey) {
      return this.fallbackAdapter.generateText({ prompt, systemPrompt });
    }

    try {
      return await this.breaker.fire({ prompt, systemPrompt, temperature, maxTokens });
    } catch (err) {
      logger.error({ err: err.message }, '[AnthropicAdapter] Error in generateText');
      return this.fallbackAdapter.generateText({ prompt, systemPrompt });
    }
  }

  async generateStructured({ prompt, systemPrompt = '', schema }) {
    if (!this.apiKey) {
      return this.fallbackAdapter.generateStructured({ prompt, systemPrompt, schema });
    }

    const structuredPrompt = `${prompt}\n\nYou MUST respond strictly in valid JSON format matching this schema:\n${JSON.stringify(schema._def || {})}`;

    try {
      const res = await this.generateText({
        prompt: structuredPrompt,
        systemPrompt: `${systemPrompt}\nYou are a strict JSON generator. Return only raw JSON without Markdown fencing or preamble.`,
      });

      const parsed = JSON.parse(
        res.text
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim()
      );
      const validated = schema.parse(parsed);
      return { data: validated, usage: res.usage };
    } catch {
      return this.fallbackAdapter.generateStructured({ prompt, systemPrompt, schema });
    }
  }

  async streamText({ prompt, systemPrompt = '', onToken, onComplete, onError }) {
    if (!this.apiKey) {
      return this.fallbackAdapter.streamText({
        prompt,
        systemPrompt,
        onToken,
        onComplete,
        onError,
      });
    }

    try {
      // In production with API key, stream via fetch to Anthropic messages stream
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 2048,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }],
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API returned HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullText = '';

      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) {
          streamDone = true;
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));

        for (const line of lines) {
          const raw = line.replace('data: ', '').trim();
          if (raw === '[DONE]') break;
          try {
            const data = JSON.parse(raw);
            if (data.type === 'content_block_delta' && data.delta?.text) {
              const textDelta = data.delta.text;
              fullText += textDelta;
              if (onToken) onToken(textDelta);
            }
          } catch {
            // parse error
          }
        }
      }

      const result = { fullText, usage: { promptTokens: 0, completionTokens: 0 } };
      if (onComplete) onComplete(result);
      return result;
    } catch (err) {
      logger.warn({ err: err.message }, '[AnthropicAdapter] Stream failed, using fallback stream');
      return this.fallbackAdapter.streamText({
        prompt,
        systemPrompt,
        onToken,
        onComplete,
        onError,
      });
    }
  }

  async _callAnthropicApi({ prompt, systemPrompt, temperature, maxTokens }) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    return {
      text,
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
      },
    };
  }
}

export default AnthropicLLMAdapter;
