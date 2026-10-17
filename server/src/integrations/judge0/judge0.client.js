import axios from 'axios';
import CircuitBreaker from 'opossum';
import { IJudge0Adapter, JUDGE0_LANGUAGE_IDS } from './judge0.interface.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

export class Judge0Client extends IJudge0Adapter {
  constructor() {
    super();
    this.apiUrl = env.JUDGE0_API_URL.replace(/\/$/, '');
    this.apiKey = env.JUDGE0_API_KEY;

    // Wrap remote HTTP execution in Opossum Circuit Breaker
    const options = {
      timeout: 15000, // 15 seconds
      errorThresholdPercentage: 50, // Open circuit if 50% fails
      resetTimeout: 30000, // Try reset after 30 seconds
    };

    this.breaker = new CircuitBreaker(this._executeRemote.bind(this), options);

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

    const payload = {
      source_code: sourceCode,
      language_id: languageId,
      stdin: stdin || '',
      expected_output: expectedOutput || null,
      cpu_time_limit: timeLimitMs ? timeLimitMs / 1000 : 2.0,
      memory_limit: memoryLimitKb || 256000,
    };

    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['X-RapidAPI-Key'] = this.apiKey;
      headers['X-Auth-Token'] = this.apiKey;
    }

    const response = await axios.post(
      `${this.apiUrl}/submissions?base64_encoded=false&wait=true`,
      payload,
      { headers, timeout: 12000 }
    );

    const data = response.data;

    return {
      status: data.status,
      stdout: data.stdout,
      stderr: data.stderr,
      compileOutput: data.compile_output,
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
