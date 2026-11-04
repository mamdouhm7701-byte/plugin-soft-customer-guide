'use client';
import { useSyncExternalStore } from 'react';
let fallback: 'classic' | 'modern' = 'modern';
const key = 'plugin-guide-team-interface-v1',
  event = 'guide-interface-change';
function snapshot() {
  try {
    return localStorage.getItem(key) === 'classic' ? 'classic' : 'modern';
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
export function useTeamInterface() {
  const mode = useSyncExternalStore(subscribe, snapshot, () => 'modern');
  return {
    mode,
    setMode: (value: 'classic' | 'modern') => {
      fallback = value;
      try {
        localStorage.setItem(key, value);
      } catch {
        /* Preference may be unavailable in restricted browsers. */
      }
      window.dispatchEvent(new Event(event));
    },
  };
}
