/**
 * Base Interface for LLM Providers (Mock, Anthropic, etc.)
 */
export class ILLMAdapter {
  /**
   * Single-turn or multi-turn completion
   * @param {Object} options
   * @param {string} options.prompt
   * @param {string} [options.systemPrompt]
   * @param {number} [options.temperature]
   * @param {number} [options.maxTokens]
   * @returns {Promise<{ text: string, usage?: { promptTokens: number, completionTokens: number } }>}
   */
  async generateText({ _prompt, _systemPrompt, _temperature = 0.2, _maxTokens = 2048 } = {}) {
    throw new Error('generateText() must be implemented by adapter');
  }

  /**
   * JSON structured completion validated by schema
   * @param {Object} options
   * @param {string} options.prompt
   * @param {string} [options.systemPrompt]
   * @param {Object} options.schema
   * @returns {Promise<{ data: any, usage?: any }>}
   */
  async generateStructured({ _prompt, _systemPrompt, _schema } = {}) {
    throw new Error('generateStructured() must be implemented by adapter');
  }

  /**
   * Token streaming completion (for SSE and live feedback)
   * @param {Object} options
   * @param {string} options.prompt
   * @param {string} [options.systemPrompt]
   * @param {Function} options.onToken - Callback called with each chunk string
   * @param {Function} [options.onComplete] - Callback on stream termination
   * @param {Function} [options.onError] - Callback on error
   */
  async streamText({ _prompt, _systemPrompt, _onToken, _onComplete, _onError } = {}) {
    throw new Error('streamText() must be implemented by adapter');
  }
}

export default ILLMAdapter;
