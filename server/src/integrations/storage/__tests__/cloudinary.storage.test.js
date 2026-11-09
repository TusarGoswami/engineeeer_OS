import { describe, it, expect, vi, beforeEach } from 'vitest';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorageAdapter } from '../cloudinary.storage.js';
import { createStorageAdapter } from '../index.js';
import { LocalStorageAdapter } from '../local.storage.js';

vi.mock('cloudinary', () => {
  return {
    v2: {
      config: vi.fn(),
      uploader: {
        upload_stream: vi.fn((options, callback) => {
          return {
            end: vi.fn((buffer) => {
              callback(null, {
                public_id: `${options.folder}/${options.public_id}`,
                secure_url: `https://res.cloudinary.com/test-cloud/${options.folder}/${options.public_id}.webp`,
                bytes: buffer.length,
                format: 'webp',
                resource_type: options.resource_type || 'auto',
                version: 123456,
              });
            }),
          };
        }),
        destroy: vi.fn(async (publicId) => {
          return { result: 'ok', public_id: publicId };
        }),
      },
      url: vi.fn((publicId, options = {}) => {
        const transforms = options.crop ? `c_${options.crop},g_${options.gravity || 'face'}/` : '';
        return `https://res.cloudinary.com/test-cloud/image/upload/${transforms}${publicId}`;
      }),
    },
  };
});

describe('CloudinaryStorageAdapter (Roadmap Item 1)', () => {
  let adapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new CloudinaryStorageAdapter({
      cloudName: 'test-cloud',
      apiKey: 'test-key',
      apiSecret: 'test-secret',
      defaultFolder: 'engineeros-test',
    });
  });

  it('configures cloudinary with provided credentials', () => {
    expect(cloudinary.config).toHaveBeenCalledWith({
      cloud_name: 'test-cloud',
      api_key: 'test-key',
      api_secret: 'test-secret',
      secure: true,
    });
  });

  it('uploads a buffer successfully via upload_stream', async () => {
    const dummyBuffer = Buffer.from('PDF Lecture Notes Sample Content');
    const result = await adapter.upload({
      key: 'notes_cs101.pdf',
      buffer: dummyBuffer,
      contentType: 'application/pdf',
      folder: 'engineeros/academics',
    });

    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
      expect.objectContaining({
        folder: 'engineeros/academics',
        public_id: 'notes_cs101',
        resource_type: 'auto',
        overwrite: true,
      }),
      expect.any(Function)
    );

    expect(result.url).toContain('https://res.cloudinary.com/test-cloud/');
    expect(result.size).toBe(dummyBuffer.length);
  });

  it('deletes an asset via uploader.destroy', async () => {
    const success = await adapter.delete({ key: 'engineeros/avatar_user123' });
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
      'engineeros/avatar_user123',
      { resource_type: 'image' }
    );
    expect(success).toBe(true);
  });

  it('generates face-cropped avatar url', () => {
    const avatarUrl = adapter.getAvatarUrl('avatar_alex_123', 256);
    expect(cloudinary.url).toHaveBeenCalledWith('avatar_alex_123', {
      secure: true,
      width: 256,
      height: 256,
      crop: 'fill',
      gravity: 'face',
      format: 'webp',
      quality: 'auto',
    });
    expect(avatarUrl).toContain('avatar_alex_123');
  });

  it('createStorageAdapter factory returns CloudinaryStorageAdapter when configured', () => {
    const instance = createStorageAdapter({
      provider: 'cloudinary',
      cloudName: 'test-cloud',
      apiKey: 'key',
      apiSecret: 'secret',
    });
    expect(instance).toBeInstanceOf(CloudinaryStorageAdapter);
  });

  it('createStorageAdapter factory falls back to LocalStorageAdapter when local or missing credentials', () => {
    const instance = createStorageAdapter({
      provider: 'local',
      dir: 'uploads/test',
    });
    expect(instance).toBeInstanceOf(LocalStorageAdapter);
  });
});

