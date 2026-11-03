'use client';

import { actionName } from '@/lib/guide-model';
import { shortDate } from '@/components/guide/common';
import { useResource } from './api';
export function AuditLog() {
  const r = useResource<{
    logs: { action: string; entity_id: string; detail: string; created_at: string }[];
  }>('audit');
  return (
    <section>
      <div className="section-title">
        <h2>سجل الإجراءات</h2>
        <span className="muted">أحدث ١٠٠ إجراء</span>
      </div>
      {r.error && <p className="error-line">{r.error}</p>}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>الإجراء</th>
              <th>المرجع</th>
              <th>التفاصيل</th>
              <th>التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {r.data?.logs.map((l, i) => (
              <tr key={i}>
                <td>{actionName(l.action)}</td>
                <td>
                  <bdi>{l.entity_id}</bdi>
                </td>
                <td>{l.detail || '—'}</td>
                <td>{shortDate(l.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
