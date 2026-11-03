import type { ArticleContent } from './guide-model';
export function beforeStartMode(
  content: Pick<ArticleContent, 'prerequisites' | 'prerequisitesMode'>,
) {
  if (!content.prerequisites.some((x) => x.trim())) return 'hidden';
  return content.prerequisitesMode || 'details';
}
