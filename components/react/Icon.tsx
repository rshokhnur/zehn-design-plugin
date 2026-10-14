import { cx } from './cx';

export interface IconProps {
  /** Remix Icon name without prefix/suffix: "close" → ri-close-line. A name ending in -fill or -line, or an icon with no line variant ("link", "list-ordered-2"), is used as is. */
  name: string;
  className?: string;
}

// Remix icons (v4.6) that have no -line/-fill variant, so they take no suffix.
const NO_VARIANT = new Set("a-b align-bottom align-center align-justify align-left align-right align-top align-vertically asterisk attachment-2 bold bring-forward bring-to-front code-view delete-column delete-row double-quotes-l double-quotes-r emphasis-cn emphasis english-input flow-chart font-color font-size-2 font-size format-clear functions h-1 h-2 h-3 h-4 h-5 h-6 hashtag heading indent-decrease indent-increase input-cursor-move insert-column-left insert-column-right insert-row-bottom insert-row-top italic line-height link-m link-unlink-m link-unlink link list-check-2 list-check list-ordered list-unordered merge-cells-horizontal merge-cells-vertical mind-map node-tree number-0 number-1 number-2 number-3 number-4 number-5 number-6 number-7 number-8 number-9 omega organization-chart page-separator paragraph pinyin-input question-mark rounded-corner send-backward send-to-back separator single-quotes-l single-quotes-r sort-asc sort-desc space split-cells-horizontal split-cells-vertical strikethrough-2 strikethrough subscript-2 subscript superscript-2 superscript table-2 text-direction-l text-direction-r text-spacing text-wrap text translate-2 translate underline wubi-input overline sketching ai-generate draggable font-family font-mono font-sans-serif font-sans list-check-3 list-indefinite list-ordered-2 list-radio quote-text slash-commands slash-commands-2 dropdown-list info-i calendar-view carousel-view code-block focus-mode gallery-view-2 gallery-view hand kanban-view-2 kanban-view list-view slideshow-view sort-alphabet-asc sort-alphabet-desc sort-number-asc sort-number-desc stacked-view table-3 table-view text-block text-snippet timeline-view input-field formula square-root custom-size letter-spacing-2 line-height-2 translate-ai-2 translate-ai ai-generate-2 ai-generate-text font-size-ai".split(' '));

export function iconClass(name: string) {
  return /-(line|fill)$/.test(name) || NO_VARIANT.has(name) ? `ri-${name}` : `ri-${name}-line`;
}

/** Decorative Remix icon (aria-hidden). Size follows the font size of the parent. */
export function Icon({ name, className }: IconProps) {
  return <i className={cx(iconClass(name), 'leading-none', className)} aria-hidden />;
}

export function Spinner({ className }: { className?: string }) {
  return <Icon name="loader-4" className={cx('motion-safe:animate-spin', className)} />;
}
