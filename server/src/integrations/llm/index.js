import { env } from '../../config/env.js';
import { MockLLMAdapter } from './mock.llm.js';
import { AnthropicLLMAdapter } from './anthropic.llm.js';

let adapterInstance = null;

export const getLLMAdapter = () => {
  if (adapterInstance) {
    return adapterInstance;
  }

  if (env.LLM_PROVIDER === 'anthropic' && env.ANTHROPIC_API_KEY) {
    adapterInstance = new AnthropicLLMAdapter();
  } else {
    adapterInstance = new MockLLMAdapter();
  }

  return adapterInstance;
};

export default { getLLMAdapter };
