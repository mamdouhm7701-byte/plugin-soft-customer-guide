// Local deterministic matching: no external service or customer query transmission.
export const normalizeSearch = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .toLowerCase();
const groups = [
  ['فاتوره', 'فواتير'],
  ['عميل', 'عملاء', 'زبون', 'زباين'],
  ['مورد', 'موردين'],
  ['صنف', 'اصناف', 'منتج', 'منتجات'],
  ['مخزن', 'مخازن', 'مستودع', 'مستودعات'],
  ['بحث', 'ابحث', 'دور', 'تدوير'],
  ['حذف', 'امسح', 'مسح'],
  ['اضافه', 'انشاء', 'جديد'],
  ['تعديل', 'تغيير'],
  ['طباعه', 'اطبع'],
];
const stop = new Set([
  'ازاي',
  'كيف',
  'فين',
  'اين',
  'هل',
  'انا',
  'عايز',
  'عاوزه',
  'ممكن',
  'عن',
  'في',
  'من',
  'علي',
  'الي',
  'ده',
  'دي',
  'اللي',
  'اعمل',
]);
export function searchTokens(s: string) {
  return normalizeSearch(s)
    .split(/[^\p{L}\p{N}-]+/u)
    .filter(Boolean)
    .map((w) => (w.startsWith('ال') && w.length > 4 ? w.slice(2) : w));
}
function canonical(w: string) {
  return groups.find((g) => g.includes(w))?.[0] || w;
}
function near(a: string, b: string) {
  if (
    a.length < 5 ||
    b.length < 5 ||
    Math.abs(a.length - b.length) > 1 ||
    !/^[\u0621-\u064a]+$/.test(a + b)
  )
    return false;
  let i = 0,
    j = 0,
    n = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++n > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return n + (a.length - i) + (b.length - j) <= 1;
}
export function arabicScore(text: string, query: string) {
  const raw = normalizeSearch(query).trim();
  if (!raw) return 1;
  const words = searchTokens(text),
    q = searchTokens(query).filter((w) => !stop.has(w));
  if (!q.length) return 0;
  let score = 0;
  for (const word of q) {
    if (words.includes(word)) {
      score += 4;
      continue;
    }
    if (words.some((w) => canonical(w) === canonical(word))) {
      score += 3;
      continue;
    }
    if (words.some((w) => w.includes(word))) {
      score += 2;
      continue;
    }
    if (words.some((w) => near(w, word))) {
      score += 1;
      continue;
    }
    return 0;
  }
  return score + (normalizeSearch(text).includes(raw) ? 8 : 0);
}
export function similarity(title: string, other: string) {
  const a = [
      ...new Set(
        searchTokens(title)
          .filter((w) => !stop.has(w))
          .map(canonical),
      ),
    ],
    b = new Set(
      searchTokens(other)
        .filter((w) => !stop.has(w))
        .map(canonical),
    );
  if (!a.length || !b.size) return 0;
  const common = a.filter((w) => b.has(w)).length;
  return (2 * common) / (a.length + b.size);
}
