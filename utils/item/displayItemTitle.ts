import { WardrobeItem } from '@/types/models/item';
import i18n from '@lib/i18n/config';

/**
 * Returns the title that should be shown in UI.
 *
 * Rules:
 * - If the item has `metadata.autoTitle`, it is a generated title and may be localized.
 * - Otherwise, return the stored `item.title` (user-entered title must not be translated).
 */
export function getDisplayItemTitle(item: WardrobeItem, fallback: string = 'Untitled'): string {
  const auto = item.metadata?.autoTitle;
  if (auto?.kind === 'categoryCounter' && typeof auto.number === 'number') {
    const key = `categories:items.${auto.category}`;
    const label = i18n.t(key);
    const categoryLabel =
      typeof label === 'string' && label !== key ? label : String(auto.category);
    return `${categoryLabel} ${auto.number}`;
  }

  if (typeof item.title === 'string' && item.title.trim().length > 0) {
    return item.title;
  }

  return fallback;
}
