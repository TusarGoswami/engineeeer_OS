/**
 * Storage Adapter Interface
 */
export class IStorageAdapter {
  async upload({ _key, _buffer, _contentType } = {}) {
    throw new Error('upload() must be implemented by adapter');
  }

  async download({ _key } = {}) {
    throw new Error('download() must be implemented by adapter');
  }

  async delete({ _key } = {}) {
    throw new Error('delete() must be implemented by adapter');
  }

  getUrl(_key) {
    throw new Error('getUrl() must be implemented by adapter');
  }
}

export default IStorageAdapter;

