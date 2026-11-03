'use client';
import { useId, useRef, useState, type ReactNode } from 'react';
import { Info } from 'lucide-react';
export function ActionHint({ text, children }: { text: string; children: ReactNode }) {
  const id = useId(),
    root = useRef<HTMLSpanElement>(null),
    [open, setOpen] = useState(false),
    [position, setPosition] = useState({ left: 16, top: 16 });
  function show() {
    const box = root.current?.getBoundingClientRect();
    if (box)
      setPosition({
        left: Math.max(
          12,
          Math.min(box.right - 260, window.innerWidth - Math.min(260, window.innerWidth - 24) - 12),
        ),
        top: box.bottom + 110 < window.innerHeight ? box.bottom + 6 : Math.max(12, box.top - 100),
      });
    setOpen(true);
  }
  return (
    <span
      className="action-hint"
      ref={root}
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') show();
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse') setOpen(false);
      }}
      onFocus={(e) => {
        if (!(e.target as HTMLElement).closest('.hint-info')) show();
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false);
      }}
    >
      {children}
      <button
        type="button"
        className="hint-info"
        aria-label={'توضيح: ' + text}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={show}
      >
        <Info size={15} />
      </button>
      {open && (
        <span role="tooltip" id={id} className="action-tooltip" style={position}>
          {text}
        </span>
      )}
    </span>
  );
}
