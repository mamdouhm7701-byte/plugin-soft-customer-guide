'use client';
import { MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { whatsappLink } from '@/lib/whatsapp';
import { ActionHint } from '@/components/guide/ActionHint';
export function WhatsAppShare({
  text,
  primary = false,
}: {
  text: () => string;
  primary?: boolean;
}) {
  const [error, setError] = useState('');
  return (
    <span className="copy-control">
      <ActionHint text="يفتح واتساب ويب على الكمبيوتر، أو واتساب على الموبايل، بالرسالة والرابط جاهزين. اختار المحادثة وراجع الرسالة واضغط إرسال بنفسك.">
        <button
          type="button"
          className={primary ? 'button primary' : 'button secondary small'}
          onClick={() => {
            setError('');
            const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            const opened = window.open(whatsappLink(text(), mobile), '_blank');
            if (opened) opened.opener = null;
            else
              setError('المتصفح منع فتح واتساب؛ اسمح بالنوافذ الجديدة أو استخدم نسخ الرد والرابط.');
          }}
        >
          <MessageCircle size={16} />
          إرسال بالواتساب
        </button>
      </ActionHint>
      {error && (
        <span className="copy-error" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}
