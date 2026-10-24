import contributionsData from '@/data/kernel-contributions.json';
import type { KernelContribution } from '../kernel/kernel';

// This page's own curated order — excludes RFCs and pushes the two
// STAGING/ipu7 patches to the end. Doesn't touch the shared JSON, so
// /kernel's ordering and counts are unaffected. Shared by page.tsx and the
// /lore social card so their counts match.
export function loreContributions(): KernelContribution[] {
  const { contributions } = contributionsData as { contributions: KernelContribution[] };
  const listed = contributions.filter((c) => c.status !== 'rfc');
  return [
    ...listed.filter((c) => c.subsystem !== 'STAGING'),
    ...listed.filter((c) => c.subsystem === 'STAGING'),
  ];
}
