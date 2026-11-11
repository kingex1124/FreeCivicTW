'use client';
import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { AnalyticsService } from '@/Service/AnalyticsService';
import type { SourceLinkProps } from '@/Model/SourceModel';
import type { TrackedLinkProps } from '@/Model/UiModel';
export function SourceLink({ source }: SourceLinkProps) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => AnalyticsService.track('source_link_open', { content_id: source.id })}
    >
      {source.title}
      <ExternalLink size={14} />
    </a>
  );
}
export function LearningPathLink({ href, children, contentId, className }: TrackedLinkProps) {
  return (
    <Link
      href={href}
      className={className ?? 'text-link'}
      onClick={() => AnalyticsService.track('learning_path_start', { content_id: contentId })}
    >
      {children}
      <ArrowRight size={16} />
    </Link>
  );
}
