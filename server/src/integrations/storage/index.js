import { LocalStorageAdapter } from './local.storage.js';

// Default to local filesystem storage adapter
export const storageAdapter = new LocalStorageAdapter('uploads/avatars');

export { LocalStorageAdapter } from './local.storage.js';
export { IStorageAdapter } from './storage.interface.js';
export default storageAdapter;

