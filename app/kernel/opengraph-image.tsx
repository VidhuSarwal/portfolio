import { OG_SIZE } from '@/lib/og/card';
import { kernelCard, kernelCardAlt } from '@/lib/og/kernel-card';
import type { KernelContribution } from './kernel';
import contributionsData from '@/data/kernel-contributions.json';

const { contributions } = contributionsData as { contributions: KernelContribution[] };

export const alt = kernelCardAlt(contributions);
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function Image() {
  return kernelCard({
    eyebrow: '02 / Upstream · Mainline',
    url: 'vidhux.dev/kernel',
    title: ['Linux Kernel', 'Contributions.'],
    contributions,
  });
}
