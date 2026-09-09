/**
 * fileUtils.ts - Shared file and URI normalization helpers for PDF generation,
 * sharing, and printing across student modules.
 */

/**
 * Normalizes a file path to a valid `file://` URI scheme.
 * Ensures the `file://` scheme is present without double-prefixing.
 * Used for libraries that require a URI (e.g. react-native-share's Share.open).
 *
 * @param path - The raw file path or URI string
 * @returns A normalized `file://` URI, or empty string if input is invalid
 */
export const toFileUri = (path?: string | null): string => {
  if (!path || typeof path !== 'string') return '';
  const trimmed = path.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('file://') ? trimmed : `file://${trimmed}`;
};

/**
 * Normalizes a file path to a raw local filesystem path.
 * Strips any `file://` scheme so Android and iOS native file streams can open the file directly.
 * Used for libraries that require raw filesystem paths (e.g. react-native-print's RNPrint.print).
 *
 * @param path - The raw file path or URI string
 * @returns A raw filesystem path without `file://`, or empty string if input is invalid
 */
export const toRawFilePath = (path?: string | null): string => {
  if (!path || typeof path !== 'string') return '';
  const trimmed = path.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('file://') ? trimmed.replace(/^file:\/\//, '') : trimmed;
};
