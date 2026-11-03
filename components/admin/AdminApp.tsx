'use client';
import { useState, useEffect } from 'react';
import {
  BookOpen,
  ClipboardList,
  ExternalLink,
  FileClock,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircleQuestion,
  MessageSquare,
  Plus,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { ROLE_LABELS, canEdit, canPublish, type StaffUser } from '@/lib/guide-model';
import { Brand } from '@/components/guide/common';
import { ArticleEditor } from './ArticleEditor';
import { MediaLibrary } from './MediaLibrary';
import { AccountSettings } from './AccountSettings';
import { PackManager } from './PackManager';
import { StaffManager } from './StaffManager';
import { Questions } from './Questions';
import { TeamHelp } from './TeamHelp';
import { Dashboard } from './Dashboard';
import { ArticleList } from './ArticleList';
import { FeedbackList } from './FeedbackList';
import { AuditLog } from './AuditLog';
type Tab =
  | 'account'
  | 'dashboard'
  | 'articles'
  | 'editor'
  | 'media'
  | 'packs'
  | 'questions'
  | 'feedback'
  | 'staff'
  | 'audit'
  | 'help';
export function AdminApp({
  user,
  initialTab = 'dashboard',
  initialId = '',
}: {
  user: StaffUser;
  initialTab?: string;
  initialId?: string;
}) {
  const [tab, setTab] = useState<Tab>(initialTab as Tab),
    [editId, setEditId] = useState(initialId),
    [dirty, setDirty] = useState(false),
    [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (!dirty) return;
    const protect = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', protect);
    return () => window.removeEventListener('beforeunload', protect);
  }, [dirty]);
  const nav = [
    { id: 'dashboard', name: 'نظرة عامة', icon: LayoutDashboard },
    { id: 'articles', name: 'مكتبة الإجابات', icon: BookOpen },
    { id: 'packs', name: 'تسليم العميل', icon: ClipboardList },
    { id: 'questions', name: 'أسئلة محتاجة شرح', icon: MessageCircleQuestion },
    { id: 'feedback', name: 'ملاحظات العملاء', icon: MessageSquare },
    { id: 'help', name: 'دليل استخدام الفريق', icon: BookOpen },
    { id: 'account', name: 'حسابي وكلمة السر', icon: ShieldCheck },
    ...(canEdit(user.role) ? [{ id: 'media', name: 'مكتبة الصور', icon: Image }] : []),
    ...(canPublish(user.role) ? [{ id: 'audit', name: 'سجل الإجراءات', icon: FileClock }] : []),
    ...(user.role === 'owner' ? [{ id: 'staff', name: 'الفريق والصلاحيات', icon: Users }] : []),
  ];
  async function logout() {
    if (dirty && !confirm('فيه تعديلات غير محفوظة. تخرج؟')) return;
    const response = await fetch('/api/team/logout', {
      method: 'POST',
      headers: { Origin: location.origin },
    });
    if (response.ok) location.assign('/team/login');
  }
  function navigate(next: Tab, id = '') {
    if (dirty && !confirm('فيه تعديلات غير محفوظة. تخرج من المسودة وتفقد التعديلات؟')) return;
    setDirty(false);
    setMenuOpen(false);
    setEditId(id);
    setTab(next);
    history.replaceState(null, '', '/admin?tab=' + next + (id ? '&id=' + id : ''));
    window.scrollTo(0, 0);
  }
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-nav-heading">
          <Brand compact />
          <button
            className="button secondary admin-menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="admin-navigation"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <Menu size={18} /> الأقسام
          </button>
        </div>
        <div className="admin-caption">مساحة التدريب والدعم</div>
        <nav
          id="admin-navigation"
          className={menuOpen ? 'is-open' : 'is-closed'}
          aria-label="إدارة الدليل"
        >
          {nav.map((n) => (
            <button
              className={tab === n.id || (tab === 'editor' && n.id === 'articles') ? 'active' : ''}
              aria-current={
                tab === n.id || (tab === 'editor' && n.id === 'articles') ? 'page' : undefined
              }
              key={n.id}
              onClick={() => navigate(n.id as Tab)}
            >
              <n.icon size={18} />
              {n.name}
            </button>
          ))}
        </nav>
        <div className="admin-side-bottom">
          <span className="role-tag">
            <ShieldCheck size={15} />
            {ROLE_LABELS[user.role]}
          </span>
          <p>{user.displayName}</p>
          <a href="/" target="_blank" rel="noreferrer">
            <ExternalLink size={14} />
            فتح عرض العميل
          </a>
          <button className="button ghost small" onClick={logout}>
            <LogOut size={14} />
            تسجيل الخروج
          </button>
        </div>
      </aside>
      <div className="admin-body">
        <header className="admin-header">
          <div>
            <span className="tiny-dot" />
            منصة دليل العميل{' '}
            <span className="muted">
              /{' '}
              {nav.find((n) => n.id === tab)?.name || (tab === 'editor' ? 'تحرير شرح' : 'الإدارة')}
            </span>
          </div>
          <div className="inline-actions">
            <button
              className="icon-button admin-mobile-logout"
              onClick={logout}
              aria-label="تسجيل الخروج"
              title="تسجيل الخروج"
            >
              <LogOut size={18} />
            </button>
            {canEdit(user.role) && (
              <button className="button primary small" onClick={() => navigate('editor')}>
                <Plus size={15} />
                شرح جديد
              </button>
            )}
            <a className="button secondary small" href="/" target="_blank" rel="noreferrer">
              معاينة العميل ↗
            </a>
          </div>
        </header>
        <main className="admin-main">
          {tab === 'dashboard' && <Dashboard onNavigate={navigate} />}{' '}
          {tab === 'articles' && (
            <ArticleList user={user} onEdit={(id) => navigate('editor', id)} />
          )}{' '}
          {tab === 'editor' && canEdit(user.role) && (
            <ArticleEditor
              key={editId || 'new'}
              id={editId}
              user={user}
              onDirty={setDirty}
              onSaved={(id) => {
                setEditId(id);
                history.replaceState(null, '', '/admin?tab=editor&id=' + id);
              }}
            />
          )}{' '}
          {tab === 'media' && canEdit(user.role) && (
            <>
              <div className="section-title">
                <div>
                  <h2>مكتبة الصور الفعلية</h2>
                  <p className="muted">
                    الصور المرفوعة تُخزّن على السيرفر، وليست على جهاز الموظف فقط.
                  </p>
                </div>
              </div>
              <MediaLibrary />
            </>
          )}{' '}
          {tab === 'packs' && <PackManager />} {tab === 'questions' && <Questions />}{' '}
          {tab === 'account' && <AccountSettings user={user} />} {tab === 'help' && <TeamHelp />}{' '}
          {tab === 'feedback' && <FeedbackList />}{' '}
          {tab === 'staff' && user.role === 'owner' && <StaffManager />}{' '}
          {tab === 'audit' && canPublish(user.role) && <AuditLog />}
        </main>
        <footer className="admin-footer">
          Plugin Soft · إدارة دليل العميل · كل إجراء محفوظ حسب صلاحية الحساب
        </footer>
      </div>
    </div>
  );
}
