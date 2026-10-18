import { OG_SIZE } from '@/lib/og/card';
import { kernelCard, kernelCardAlt } from '@/lib/og/kernel-card';
import { loreContributions } from './lore';

// /lore sets its own openGraph metadata, which drops the root card — so it
// needs its own image. Uses the page's curated list so the counts match.
const contributions = loreContributions();

export const alt = kernelCardAlt(contributions);
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function Image() {
  return kernelCard({
    eyebrow: 'lore.kernel.org',
    url: 'vidhux.dev/lore',
    title: ['Linux Kernel', 'Patches.'],
    contributions,
  });
}
