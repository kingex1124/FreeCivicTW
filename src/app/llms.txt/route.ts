import { SeoService } from '@/Service/SeoService';

export const dynamic = 'force-static';

// Optional content directory for tools that consume it; not a Google indexing requirement.
export function GET() {
  return new Response(SeoService.discoveryText(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
