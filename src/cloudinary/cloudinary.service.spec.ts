import { BadRequestException } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';

jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload_stream: jest.fn((options: any, callback: Function) => {
        callback(undefined, {
          public_id: 'mock-id',
          url: 'http://example.com/mock',
          secure_url: 'https://example.com/mock',
          format: 'png',
          bytes: 1234,
          resource_type: 'image',
          created_at: new Date().toISOString(),
        });
        return { on: jest.fn() };
      }),
      upload: jest.fn().mockResolvedValue({
        public_id: 'mock-id',
        url: 'http://example.com/mock',
        secure_url: 'https://example.com/mock',
        format: 'png',
        bytes: 1234,
        resource_type: 'image',
        created_at: new Date().toISOString(),
      }),
      destroy: jest.fn(),
    },
  },
}));

jest.mock('streamifier', () => ({
  createReadStream: jest.fn().mockReturnValue({
    pipe: jest.fn(),
  }),
}));

describe('CloudinaryService', () => {
  const cloudinaryLib = require('cloudinary');
  const streamifier = require('streamifier');

  let service: CloudinaryService;
  let db: any;

  beforeEach(() => {
    db = global.createMockDb();
    service = new CloudinaryService(db);

    cloudinaryLib.v2.uploader.upload_stream.mockClear();
    cloudinaryLib.v2.uploader.upload.mockClear();
    cloudinaryLib.v2.uploader.destroy.mockClear();
    streamifier.createReadStream.mockClear();
  });

  it('throws when no file buffer provided', async () => {
    await expect(service.uploadFile(undefined as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('uploads a file buffer and maps response', async () => {
    const file = {
      buffer: Buffer.from('file'),
      originalname: 'file.png',
      mimetype: 'image/png',
      size: 123,
    } as Express.Multer.File;

    const result = await service.uploadFile(file);

    expect(result.publicId).toEqual('mock-id');
    expect(streamifier.createReadStream).toHaveBeenCalledWith(file.buffer);
  });

  it('saves upload metadata for package images', async () => {
    const file = {
      buffer: Buffer.from('file'),
      originalname: 'file.png',
      mimetype: 'image/png',
      size: 123,
    } as Express.Multer.File;

    db.insert.mockReturnThis();
    db.values.mockReturnThis();

    await service.uploadPackageImage(file, 'package-1', 'org-1');

    expect(db.insert).toHaveBeenCalled();
    expect(db.values).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        fileTitle: expect.stringContaining('Package Image'),
      }),
    );
  });
});
