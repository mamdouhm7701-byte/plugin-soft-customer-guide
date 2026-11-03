'use client';
import { useState } from 'react';
import { useResource } from './api';
import { moduleName, normalize } from '@/lib/guide-model';
type Rule = {
  id: string;
  source: string;
  scope: string;
  answer: string;
  example: string;
  module: string;
};
export function BusinessReference() {
  const r = useResource<{ rules: Rule[] }>('business'),
    [q, setQ] = useState('');
  const rules = (r.data?.rules ?? []).filter((x) =>
    normalize(x.answer + ' ' + x.example + ' ' + x.id).includes(normalize(q)),
  );
  return (
    <section className="panel business-reference">
      <h2>مرجع قواعد البيزنس</h2>
      <p className="muted">
        قواعد وأمثلة مستخرجة من المشروع. اختلافات البرنامج المسجلة تفضل واضحة؛ المثال الحسابي مش
        نتيجة تنفيذ على حساب العميل.
      </p>
      <input
        type="search"
        aria-label="البحث في قواعد البيزنس"
        placeholder="ابحث عن مخزون، مرتجع، راتب…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {r.error && <p className="error-line">{r.error}</p>}
      {rules.map((rule) => (
        <details key={rule.id} className="business-rule">
          <summary>
            {moduleName(rule.module)} · {rule.answer}
          </summary>
          <p>{rule.example}</p>
          <small className="muted">
            المصدر: <bdi>{rule.source}</bdi> · <bdi>{rule.id}</bdi>
          </small>
        </details>
      ))}
    </section>
  );
}
