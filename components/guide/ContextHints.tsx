'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { CircleHelp, X } from 'lucide-react';
import { controlHint } from '@/lib/context-hints';
import { ThemeToggle } from './ThemeToggle';
function subscribeModal(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['open'],
  });
  return () => observer.disconnect();
}
function modalHost() {
  return (
    Array.from(document.querySelectorAll<HTMLDialogElement>('dialog[open]')).at(-1) || document.body
  );
}
export function ContextHints() {
  const host = useSyncExternalStore(subscribeModal, modalHost, () => null);
  const [touchHelp, setTouchHelp] = useState(false),
    [hint, setHint] = useState<{ text: string; left: number; top: number } | null>(null),
    active = useRef<HTMLElement | null>(null),
    previousDescription = useRef<string | null>(null);
  useEffect(() => {
    function restoreDescription() {
      if (active.current) {
        if (previousDescription.current === null)
          active.current.removeAttribute('aria-describedby');
        else active.current.setAttribute('aria-describedby', previousDescription.current);
      }
      active.current = null;
    }
    function target(event: Event) {
      const node = event.target as Element | null;
      return (
        node?.closest<HTMLElement>(
          'button,a[href],input:not([type="hidden"]),select,textarea,[role="button"]',
        ) || null
      );
    }
    function show(el: HTMLElement) {
      if (el.closest('[data-context-hints]') || (!touchHelp && el.closest('.action-hint'))) return;
      const field = el as HTMLInputElement;
      const label =
        el.dataset.hint ||
        el.getAttribute('aria-label') ||
        (field.labels?.[0]?.childNodes
          ? Array.from(field.labels[0].childNodes)
              .filter((n) => n.nodeType === Node.TEXT_NODE)
              .map((n) => n.textContent)
              .join(' ')
          : '') ||
        (['BUTTON', 'A'].includes(el.tagName) ? el.textContent : '') ||
        el.getAttribute('placeholder') ||
        '';
      const box = el.getBoundingClientRect();
      if (active.current !== el) {
        restoreDescription();
        active.current = el;
        previousDescription.current = el.getAttribute('aria-describedby');
        el.setAttribute(
          'aria-describedby',
          [previousDescription.current, 'global-control-hint'].filter(Boolean).join(' '),
        );
      }
      setHint({
        text:
          el.dataset.hint ||
          controlHint(
            label.trim().slice(0, 100),
            field.type === 'checkbox' ? 'checkbox' : el.tagName.toLowerCase(),
            el.getAttribute('href') || '',
          ),
        left: Math.max(
          12,
          Math.min(box.right - 260, innerWidth - Math.min(260, innerWidth - 24) - 12),
        ),
        top: box.bottom + 120 < innerHeight ? box.bottom + 6 : Math.max(12, box.top - 110),
      });
    }
    const over = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') {
        const el = target(event);
        if (el) show(el);
        else {
          restoreDescription();
          setHint(null);
        }
      }
    };
    const focus = (event: FocusEvent) => {
      const el = target(event);
      if (el) show(el);
    };
    const click = (event: MouseEvent) => {
      if (!touchHelp) return;
      const el = target(event);
      if (!el || el.closest('[data-context-hints]')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      show(el);
    };
    const dismiss = () => {
      restoreDescription();
      setHint(null);
    };
    const leave = (event: PointerEvent) => {
      if (!(event.relatedTarget instanceof Node) || !active.current?.contains(event.relatedTarget))
        dismiss();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        dismiss();
        setTouchHelp(false);
      }
    };
    document.addEventListener('pointerover', over);
    document.addEventListener('pointerout', leave);
    document.addEventListener('focusin', focus);
    document.addEventListener('focusout', dismiss);
    document.addEventListener('click', click, true);
    document.addEventListener('keydown', key);
    window.addEventListener('scroll', dismiss, true);
    window.addEventListener('resize', dismiss);
    return () => {
      restoreDescription();
      document.removeEventListener('pointerover', over);
      document.removeEventListener('pointerout', leave);
      document.removeEventListener('focusin', focus);
      document.removeEventListener('focusout', dismiss);
      document.removeEventListener('click', click, true);
      document.removeEventListener('keydown', key);
      window.removeEventListener('scroll', dismiss, true);
      window.removeEventListener('resize', dismiss);
    };
  }, [touchHelp]);
  if (!host) return null;
  return createPortal(
    <div data-context-hints="true">
      <ThemeToggle />
      <button
        className={'context-help-toggle' + (touchHelp ? ' active' : '')}
        type="button"
        aria-pressed={touchHelp}
        aria-label={touchHelp ? 'إنهاء وضع توضيح الأزرار' : 'تفعيل وضع توضيح الأزرار'}
        onClick={() => {
          setTouchHelp(!touchHelp);
          setHint(null);
        }}
      >
        {touchHelp ? <X size={18} /> : <CircleHelp size={18} />}
        <span>{touchHelp ? 'إنهاء التوضيح' : 'مساعدة الأزرار'}</span>
      </button>
      {touchHelp && (
        <p className="context-help-mode" role="status">
          المس أي زر أو حقل عشان تشوف وظيفته. اقفل وضع التوضيح عشان تستخدمه.
        </p>
      )}
      {hint && (
        <span
          id="global-control-hint"
          className="action-tooltip global-hint"
          role="tooltip"
          style={{ left: hint.left, top: hint.top }}
        >
          {hint.text}
        </span>
      )}
    </div>,
    host,
  );
}
