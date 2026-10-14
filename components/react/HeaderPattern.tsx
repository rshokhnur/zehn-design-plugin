import { useId } from 'react';
import { cx } from './cx';
import { HEADER_PATTERN_LINES } from './headerPatternPaths';

const LINES = HEADER_PATTERN_LINES.split('|');

// Rounded capsules behind the lines, blurred (Figma: teal, cyan, lime at 20%).
const BLOBS = [
  { cls: 'fill-teal', d: 'M368 160C368 133.49 389.49 112 416 112H520C546.51 112 568 133.49 568 160C568 186.51 546.51 208 520 208H416C389.49 208 368 186.51 368 160Z' },
  { cls: 'fill-cyan', d: 'M200 160C200 133.49 221.49 112 248 112H352C378.51 112 400 133.49 400 160C400 186.51 378.51 208 352 208H248C221.49 208 200 186.51 200 160Z' },
  { cls: 'fill-lime', d: 'M272 96C272 69.4903 293.49 48 320 48H424C450.51 48 472 69.4903 472 96C472 122.51 450.51 144 424 144H320C293.49 144 272 122.51 272 96Z' },
];

export interface HeaderPatternProps {
  className?: string;
}

/**
 * Decorative top-right art for list/overview pages (Figma "Header Pattern").
 * Put it first inside a `relative overflow-hidden` page container so it sits behind the content and
 * never causes horizontal scroll; give the content `relative` so it stacks above it.
 * 768px wide on desktop, scales down with the container. Lines follow text-primary (light/dark).
 */
export function HeaderPattern({ className }: HeaderPatternProps) {
  const uid = useId().replace(/:/g, '');
  const blur = `zm-hp-blur-${uid}`;
  const mask = `zm-hp-mask-${uid}`;
  const grad = `zm-hp-grad-${uid}`;
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 768 256"
      fill="none"
      className={cx('pointer-events-none absolute right-0 top-0 h-auto w-full max-w-column-narrow text-text-primary', className)}
    >
      <defs>
        <filter id={blur} x="0" y="-64" width="768" height="384" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="30" />
        </filter>
        <mask id={mask} maskUnits="userSpaceOnUse" x="-1" y="-1" width="770" height="434" style={{ maskType: 'alpha' }}>
          {LINES.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </mask>
        <radialGradient id={grad} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(384 128) rotate(90) scale(128 384)">
          <stop stopColor="currentColor" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g filter={`url(#${blur})`} opacity={0.2}>
        {BLOBS.map((b) => (
          <path key={b.cls} d={b.d} className={b.cls} />
        ))}
      </g>
      <g mask={`url(#${mask})`}>
        <rect width="768" height="256" fill={`url(#${grad})`} />
      </g>
    </svg>
  );
}
