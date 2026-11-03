'use client';

import { BookOpen, ClipboardList, MessageCircleQuestion } from 'lucide-react';

import { useResource } from './api';
export function Dashboard({
  onNavigate,
}: {
  onNavigate: (t: 'articles' | 'packs' | 'questions') => void;
}) {
  const r = useResource<{
    articles: { total: number; published: number; review: number; draft: number };
    packs: { total: number; active: number };
    feedback: { total: number; needs_attention: number };
  }>('dashboard');
  return (
    <section>
      <div className="welcome-heading">
        <span className="eyebrow">معرفة الفريق، بتخدم العميل</span>
        <h1>كل سؤال متكرر فرصة لشرح أوضح.</h1>
        <p>جهّز المحتوى، راجعه، وسلّم العميل مرجع يقدر يرجع له بعد التدريب.</p>
      </div>
      {r.error && <p className="error-line">{r.error}</p>}
      <div className="metrics-grid">
        <div className="metric-panel">
          <span>شروحات منشورة</span>
          <strong>{r.data?.articles.published ?? '—'}</strong>
          <small>متاحة للعميل مباشرة</small>
        </div>
        <div className="metric-panel">
          <span>بانتظار المراجعة</span>
          <strong>{r.data?.articles.review ?? '—'}</strong>
          <small>مسودات لم تظهر للعميل بعد</small>
        </div>
        <div className="metric-panel">
          <span>أدلة تسليم فعّالة</span>
          <strong>{r.data?.packs.active ?? '—'}</strong>
          <small>روابط مخصصة بعد التدريب</small>
        </div>
        <div className="metric-panel">
          <span>ملاحظات تحتاج متابعة</span>
          <strong>{r.data?.feedback.needs_attention ?? '—'}</strong>
          <small>العميل اختار «محتاج توضيح»</small>
        </div>
      </div>
      <div className="dashboard-actions">
        <button className="panel action-panel" onClick={() => onNavigate('articles')}>
          <BookOpen size={26} />
          <h3>رد على السؤال برابط</h3>
          <p>ابحث عن السؤال وانسخ الرد مع الشرح المصوّر.</p>
          <span>فتح مكتبة الإجابات ←</span>
        </button>
        <button className="panel action-panel" onClick={() => onNavigate('packs')}>
          <ClipboardList size={26} />
          <h3>اقفل التدريب بدليل واضح</h3>
          <p>اختَر النشاط والأقسام، وجهّز رابط ورسالة تسليم.</p>
          <span>تجهيز دليل العميل ←</span>
        </button>
        <button className="panel action-panel" onClick={() => onNavigate('questions')}>
          <MessageCircleQuestion size={26} />
          <h3>حوّل التكرار لأولوية</h3>
          <p>سجّل الأسئلة الناقصة وحدّد اللي بيتكرر أكتر.</p>
          <span>الأسئلة المطلوب توثيقها ←</span>
        </button>
      </div>
      <div className="soft-note">
        المكتبة اتوسعت لتشمل إرشادات وأسئلة بيزنس للشاشات والتقارير. المسودات منفصلة عن خمسة شروحات
        منشورة موثقة للشاشات العامة. افتح مكتبة الإجابات للاطلاع عليها. إضافة نشاط جديد للمنصة لا
        تعني إن كل شاشاته اتغطّت؛ انشر فقط الإجراء اللي اتراجع فعلًا.
      </div>
    </section>
  );
}
