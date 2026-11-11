import type { ReactNode } from 'react';
export type IntroProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
};
export type ChildrenProps = { children: ReactNode };
export type ActionProps = {
  href: string;
  children: ReactNode;
  secondary?: boolean;
  className?: string;
};
export type SectionHeadingProps = {
  number?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
};
export type MarkProps = { small?: boolean };
export type TrackedLinkProps = ActionProps & { contentId: string };
