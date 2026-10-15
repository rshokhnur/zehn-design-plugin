import type { ReactNode } from 'react';

/** What a component hands to `renderLink`: spread it onto your router's link (Next <Link>, React Router <Link to>). */
export interface ZehnLinkProps {
  href: string;
  className: string;
  'aria-current'?: 'page';
  children: ReactNode;
}

export type RenderLink = (props: ZehnLinkProps) => ReactNode;

/** Default: a plain <a>. */
export const defaultRenderLink: RenderLink = ({ href, className, children, ...rest }) => (
  <a href={href} className={className} {...rest}>
    {children}
  </a>
);
