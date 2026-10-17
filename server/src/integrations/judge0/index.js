import { MockJudge0Adapter } from './mock.judge0.js';
import { Judge0Client } from './judge0.client.js';
import { env } from '../../config/env.js';

let instance = null;

export const getJudge0Adapter = () => {
  if (instance) {
    return instance;
  }

  if (env.CODE_EXEC_PROVIDER === 'judge0') {
    instance = new Judge0Client();
  } else {
    instance = new MockJudge0Adapter();
  }

  return instance;
};

export default getJudge0Adapter;
