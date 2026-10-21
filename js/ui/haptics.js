// Haptik via navigator.vibrate (iOS-Safari unterstützt es meist nicht – dann still).
import { getApp } from '../app-context.js';
const PATTERNS = { light: 8, medium: 15, success: [10, 40, 18], error: [30, 50, 30], select: 5 };
export function haptic(kind = 'light') {
  try {
    if (getApp()?.store?.state?.settings?.haptics === false) return;
    if (navigator.vibrate) navigator.vibrate(PATTERNS[kind] ?? 10);
  } catch {}
}
