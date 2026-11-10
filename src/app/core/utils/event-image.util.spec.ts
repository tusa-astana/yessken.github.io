import { afterEach, describe, expect, it, vi } from 'vitest';
import { compressEventImage } from './event-image.util';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('compressEventImage', () => {
  it('creates a compact self-contained WebP data URL from an allowed image', async () => {
    const bitmap = { width: 800, height: 600, close: vi.fn() } as unknown as ImageBitmap;
    vi.stubGlobal('createImageBitmap', vi.fn(async () => bitmap));
    const drawImage = vi.fn();
    const webpBytes = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({ drawImage })),
      toBlob: (callback: BlobCallback) => callback(new Blob([webpBytes], { type: 'image/webp' })),
    } as unknown as HTMLCanvasElement;
    const createElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) =>
      tagName === 'canvas' ? canvas : createElement(tagName)) as typeof document.createElement);

    const image = new File(['source image'], 'poster.jpg', { type: 'image/jpeg' });
    const result = await compressEventImage(image);

    expect(result).toMatch(/^data:image\/webp;base64,/);
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(600);
    expect(drawImage).toHaveBeenCalledWith(bitmap, 0, 0, 800, 600);
    expect(bitmap.close).toHaveBeenCalledOnce();
  });

  it('rejects non-image files before decoding', async () => {
    const createImageBitmap = vi.fn();
    vi.stubGlobal('createImageBitmap', createImageBitmap);
    const file = new File(['not an image'], 'notes.txt', { type: 'text/plain' });

    await expect(compressEventImage(file)).rejects.toThrow('Выберите файл изображения.');
    expect(createImageBitmap).not.toHaveBeenCalled();
  });
});
