const MAX_SOURCE_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_COMPRESSED_IMAGE_BYTES = 400 * 1024;
const MAX_IMAGE_DATA_URL_LENGTH = 600_000;

/** Compress an admin/organizer-selected image into a small self-contained WebP data URL. */
export async function compressEventImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Выберите файл изображения.');
  if (file.size > MAX_SOURCE_IMAGE_BYTES) throw new Error('Исходное изображение должно быть меньше 12 МБ.');

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1400 / bitmap.width, 900 / bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Не удалось подготовить изображение.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const compressed = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Не удалось сжать изображение.')), 'image/webp', 0.72));
    if (compressed.size > MAX_COMPRESSED_IMAGE_BYTES)
      throw new Error('После сжатия изображение всё ещё слишком большое. Выберите более простой или меньший файл.');

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Не удалось прочитать изображение.'));
      reader.readAsDataURL(compressed);
    });
    if (!dataUrl.startsWith('data:image/webp;base64,') || dataUrl.length > MAX_IMAGE_DATA_URL_LENGTH)
      throw new Error('Не удалось подготовить безопасную обложку. Попробуйте изображение меньшего размера.');
    return dataUrl;
  } catch (error) {
    if (error instanceof Error && error.message) throw error;
    throw new Error('Не удалось обработать изображение. Попробуйте JPG, PNG или WebP.');
  } finally {
    bitmap?.close();
  }
}
