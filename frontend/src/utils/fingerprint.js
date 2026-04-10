/**
 * Generate a device fingerprint from browser characteristics.
 * Returns a hash string for device recognition.
 */
export function generateDeviceFingerprint() {
  const components = [
    navigator.userAgent,
    `${screen.width}x${screen.height}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
    navigator.hardwareConcurrency || 'unknown',
    screen.colorDepth,
  ];

  const raw = components.join('|');
  return btoa(raw).slice(0, 32);
}
