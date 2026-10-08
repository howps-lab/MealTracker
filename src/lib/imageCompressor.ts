export interface CompressResult {
  file: File;
  previewUrl: string;
}

const MAX_RAW_FILE_SIZE = 25 * 1024 * 1024; // 25 MB max raw size
const MAX_DIMENSION = 1920; // 1920px max width or height
const COMPRESSION_QUALITY = 0.85;

/**
 * Validates and compresses an image file for efficient upload
 */
export async function processAndCompressImage(file: File): Promise<CompressResult> {
  // 1. Check size limit
  if (file.size > MAX_RAW_FILE_SIZE) {
    throw new Error('Image file is too large. Please select a photo under 25MB.');
  }

  // 2. Check format
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif'];
  if (!file.type.startsWith('image/') && !validTypes.includes(file.type)) {
    throw new Error('Unsupported image format. Please select a JPG, PNG, or WEBP photo.');
  }

  // If already small (< 400KB), return directly
  if (file.size < 400 * 1024 && (file.type === 'image/jpeg' || file.type === 'image/webp' || file.type === 'image/png')) {
    const previewUrl = URL.createObjectURL(file);
    return { file, previewUrl };
  }

  // Try Canvas-based compression
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.width;
      let height = img.height;

      // Scale down if larger than MAX_DIMENSION
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback to original file
        const previewUrl = URL.createObjectURL(file);
        resolve({ file, previewUrl });
        return;
      }

      // Smooth scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            const previewUrl = URL.createObjectURL(file);
            resolve({ file, previewUrl });
            return;
          }

          const safeName = file.name.replace(/\.[^/.]+$/, '') + (outputType === 'image/png' ? '.png' : '.jpg');
          const compressedFile = new File([blob], safeName, {
            type: outputType,
            lastModified: Date.now(),
          });

          const previewUrl = URL.createObjectURL(compressedFile);
          resolve({ file: compressedFile, previewUrl });
        },
        outputType,
        COMPRESSION_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // If image failed to load in Canvas (e.g. raw HEIC without native browser support), fallback to original
      const previewUrl = URL.createObjectURL(file);
      resolve({ file, previewUrl });
    };

    img.src = objectUrl;
  });
}
