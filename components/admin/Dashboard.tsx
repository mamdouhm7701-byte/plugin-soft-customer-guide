'use client';

import {
  BookOpen,
  ClipboardList,
  MessageCircleQuestion,
  ArrowUpLeft,
  RefreshCw,
  CheckCircle2,
  FileClock,
  MessageSquareText,
} from 'lucide-react';
import { DashboardCharts, type DashboardData } from './DashboardCharts';

import { useResource } from './api';
export function Dashboard({
  onNavigate,
}: {
  onNavigate: (t: 'articles' | 'packs' | 'questions' | 'feedback') => void;
}) {
  const r = useResource<DashboardData>('dashboard');
  return (
    <section>
      <div className="dashboard-heading">
        <div className="welcome-heading">
          <span className="eyebrow">معرفة الفريق، بتخدم العميل</span>
          <h1>صورة أوضح لشغل الفريق.</h1>
          <p>تابع المحتوى، شوف رأي العملاء، وابدأ المهمة اللي محتاجها.</p>
        </div>
        <button className="button secondary small" onClick={r.reload} disabled={r.loading}>
          <RefreshCw size={15} />
          تحديث البيانات
        </button>
      </div>
      {r.error && <p className="error-line">{r.error}</p>}
      <div className="metrics-grid">
        <div className="metric-panel">
          <CheckCircle2 className="metric-icon" size={20} />
          <span>شروحات منشورة</span>
          <strong>{r.data?.articles.published ?? '—'}</strong>
          <small>متاحة للعميل مباشرة</small>
        </div>
        <div className="metric-panel">
          <FileClock className="metric-icon" size={20} />
          <span>بانتظار المراجعة</span>
          <strong>{r.data?.articles.review ?? '—'}</strong>
          <small>مسودات لم تظهر للعميل بعد</small>
        </div>
        <div className="metric-panel">
          <ClipboardList className="metric-icon" size={20} />
          <span>أدلة تسليم فعّالة</span>
          <strong>{r.data?.packs.active ?? '—'}</strong>
          <small>روابط مخصصة بعد التدريب</small>
        </div>
        <div className="metric-panel">
          <MessageSquareText className="metric-icon" size={20} />
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
          <span>
            فتح مكتبة الإجابات <ArrowUpLeft size={16} />
          </span>
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
      {r.loading && !r.data && (
        <p className="soft-note" role="status">
          جارٍ تحميل بيانات الفريق…
        </p>
      )}
      {r.data && <DashboardCharts data={r.data} onNavigate={onNavigate} />}
    </section>
  );
}
