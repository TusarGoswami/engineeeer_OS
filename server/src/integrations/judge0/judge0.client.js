import CircuitBreaker from 'opossum';
import { IJudge0Adapter, JUDGE0_LANGUAGE_IDS } from './judge0.interface.js';
import { MockJudge0Adapter } from './mock.judge0.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

export class Judge0Client extends IJudge0Adapter {
  constructor() {
    super();
    this.apiUrl = env.JUDGE0_API_URL.replace(/\/$/, '');
    this.apiKey = env.JUDGE0_API_KEY;
    this.mockFallback = new MockJudge0Adapter();

    // Wrap remote HTTP execution in Opossum Circuit Breaker
    const options = {
      timeout: 25000, // 25 seconds (allows Java/C++ compilation on remote Judge0)
      errorThresholdPercentage: 50, // Open circuit if >=50% fail
      volumeThreshold: 5, // Require at least 5 requests before tripping circuit
      resetTimeout: 15000, // Try reset after 15 seconds
    };

    this.breaker = new CircuitBreaker(this._executeRemote.bind(this), options);

    // Fallback when remote Judge0 call fails, rate-limited, or circuit is open
    this.breaker.fallback(async (params, err) => {
      if (env.NODE_ENV === 'production') {
        logger.error(
          { status: err?.status, reason: err?.message },
          '[Judge0Client] Remote Judge0 execution failed in production.'
        );
        throw new Error('Code execution service is temporarily unavailable.');
      }
      logger.warn(
        {
          status: err?.status,
          reason: err?.message,
        },
        '[Judge0Client] Remote Judge0 execution unavailable or rejected. Seamlessly using sandbox fallback.'
      );
      return this.mockFallback.execute(params);
    });

    this.breaker.on('open', () =>
      logger.warn('[CircuitBreaker:Judge0] Circuit opened! Failing fast.')
    );
    this.breaker.on('close', () =>
      logger.info('[CircuitBreaker:Judge0] Circuit closed. Service restored.')
    );
  }

  async _executeRemote({
    sourceCode,
    language,
    stdin,
    expectedOutput,
    timeLimitMs,
    memoryLimitKb,
  }) {
    const languageId = JUDGE0_LANGUAGE_IDS[language] || 71; // Default Python

    const encodeBase64 = (val) => Buffer.from(val || '', 'utf8').toString('base64');
    const decodeBase64 = (val) => (val ? Buffer.from(val, 'base64').toString('utf8') : null);

    const payload = {
      source_code: encodeBase64(sourceCode),
      language_id: languageId,
      stdin: encodeBase64(stdin || ''),
      ...(expectedOutput ? { expected_output: encodeBase64(expectedOutput) } : {}),
      cpu_time_limit: timeLimitMs ? timeLimitMs / 1000 : 2.0,
      memory_limit: memoryLimitKb || 256000,
    };

    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['X-RapidAPI-Key'] = this.apiKey;
      headers['X-Auth-Token'] = this.apiKey;
      if (this.apiUrl.includes('rapidapi.com')) {
        try {
          headers['X-RapidAPI-Host'] = new URL(this.apiUrl).host;
        } catch {
          headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
        }
      }
    }

    const response = await fetch(
      `${this.apiUrl}/submissions?base64_encoded=true&wait=true`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(22000),
      }
    );

    if (!response.ok) {
      const err = new Error(`Judge0 HTTP ${response.status}`);
      err.status = response.status;
      throw err;
    }

    const data = await response.json();

    return {
      status: data.status,
      stdout: decodeBase64(data.stdout),
      stderr: decodeBase64(data.stderr),
      compileOutput: decodeBase64(data.compile_output),
      time: parseFloat(data.time || '0'),
      memory: parseInt(data.memory || '0', 10),
    };
  }

  async execute(params) {
    return this.breaker.fire(params);
  }

  async executeBatch(submissions) {
    const results = [];
    for (const sub of submissions) {
      const res = await this.execute(sub);
      results.push(res);
    }
    return results;
  }
}

export default Judge0Client;
