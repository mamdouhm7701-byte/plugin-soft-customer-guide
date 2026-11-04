'use client';
import { useSyncExternalStore, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
const key = 'plugin-guide-color-mode-v1',
  event = 'guide-color-mode-change';
let fallback: 'light' | 'dark' = 'light';
function snapshot() {
  try {
    return localStorage.getItem(key) === 'dark' ? 'dark' : 'light';
  } catch {
    return fallback;
  }
}
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(event, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(event, callback);
  };
}
export function ThemeToggle() {
  const mode = useSyncExternalStore(subscribe, snapshot, () => 'light');
  useEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, [mode]);
  return (
    <button
      type="button"
      className="appearance-toggle"
      aria-label={mode === 'light' ? 'تفعيل الوضع الداكن' : 'تفعيل الوضع الفاتح'}
      aria-pressed={mode === 'dark'}
      data-hint="يغير ألوان البرنامج بين الفاتح والداكن ويحفظ اختيارك على المتصفح ده؛ الصور الأصلية تفضل بألوانها."
      onClick={() => {
        fallback = mode === 'light' ? 'dark' : 'light';
        try {
          localStorage.setItem(key, fallback);
        } catch {
          /* Temporary preference is still usable. */
        }
        document.documentElement.dataset.theme = fallback;
        window.dispatchEvent(new Event(event));
      }}
    >
      {mode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
      <span>{mode === 'light' ? 'داكن' : 'فاتح'}</span>
    </button>
  );
}
