/**
 * Validates image buffer using magic bytes sniffing (JPEG, PNG, WebP)
 * Protects against MIME spoofing and malicious file uploads
 *
 * @param {Buffer} buffer
 * @returns {{ isValid: boolean, mimeType: string | null }}
 */
export function validateImageMagicBytes(buffer) {
  if (!buffer || buffer.length < 12) {
    return { isValid: false, mimeType: null };
  }

  // Check JPEG (0xFF, 0xD8, 0xFF)
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, mimeType: 'image/jpeg' };
  }

  // Check PNG (0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { isValid: true, mimeType: 'image/png' };
  }

  // Check WEBP (RIFF....WEBP)
  // Bytes 0-3: 'RIFF' (0x52, 0x49, 0x46, 0x46)
  // Bytes 8-11: 'WEBP' (0x57, 0x45, 0x42, 0x50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { isValid: true, mimeType: 'image/webp' };
  }

  return { isValid: false, mimeType: null };
}

export default validateImageMagicBytes;

