import fs from 'fs';
import path from 'path';
import { IStorageAdapter } from './storage.interface.js';

export class LocalStorageAdapter extends IStorageAdapter {
  constructor(baseDir = 'uploads') {
    super();
    this.baseDir = path.resolve(process.cwd(), baseDir);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  _getFilePath(key) {
    // Sanitize key to prevent path traversal
    const safeKey = path.basename(key);
    return path.join(this.baseDir, safeKey);
  }

  async upload({ key, buffer, _contentType }) {
    const filePath = this._getFilePath(key);
    await fs.promises.writeFile(filePath, buffer);
    return {
      key,
      url: this.getUrl(key),
      size: buffer.length,
    };
  }

  async download({ key }) {
    const filePath = this._getFilePath(key);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${key}`);
    }
    return await fs.promises.readFile(filePath);
  }

  async delete({ key }) {
    const filePath = this._getFilePath(key);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  }

  getUrl(key) {
    return `/api/v1/users/avatar/${encodeURIComponent(key)}`;
  }
}

export default LocalStorageAdapter;

