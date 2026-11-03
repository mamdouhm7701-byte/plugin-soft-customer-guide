'use client';
import { useState } from 'react';
import { Download, FileDown } from 'lucide-react';
import { articleSchema, type DraftRecord } from '@/lib/guide-model';
import { api, explain } from './api';

export function ContentExport() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function excel() {
    setBusy(true);
    setError('');
    try {
      const data = await api<{ articles: Record<string, unknown>[] }>('export');
      const records: DraftRecord[] = data.articles.map((row) => ({
        id: String(row.id),
        content: articleSchema.parse(JSON.parse(String(row.draft_json))),
        status: String(row.status),
        revision: Number(row.revision),
        publishedRevision: row.published_revision === null ? null : Number(row.published_revision),
        archived: !!row.archived,
        reviewNote: String(row.review_note ?? ''),
        updatedAt: String(row.updated_at),
        publishedAt: row.published_at ? String(row.published_at) : null,
      }));
      const { contentWorkbook } = await import('@/lib/content-export');
      const bytes = await contentWorkbook(records, location.origin);
      const blob = new Blob([new Uint8Array(bytes)], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob),
        link = document.createElement('a');
      link.href = url;
      link.download = 'plugin-guide-content.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <div className="inline-actions">
        <button className="button secondary small" disabled={busy} onClick={excel}>
          <Download size={16} />
          {busy ? 'جارٍ تجهيز Excel…' : 'تنزيل Excel'}
        </button>
        <a
          className="button secondary small"
          href="/admin/export/print"
          target="_blank"
          rel="noreferrer"
        >
          <FileDown size={16} />
          طباعة / حفظ PDF
        </a>
      </div>
      {error && (
        <p className="error-line" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
