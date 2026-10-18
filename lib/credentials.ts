// Headline credentials — shown in the Hero (`label`) and baked into the
// social card (app/opengraph-image.tsx, `short` / `org`). Edit here and both
// stay in sync.
export const CREDENTIALS = [
  { index: '01', label: 'LINUX KERNEL MENTORSHIP PROGRAM · LFX', year: "'26", short: "LFX '26", org: 'Linux Kernel Mentorship' },
  { index: '02', label: 'GOOGLE SUMMER OF CODE · BEAGLEBOARD.ORG', year: "'25", short: "GSoC '25", org: 'BeagleBoard.org' },
  { index: '03', label: 'SAMSUNG R&D · PRISM RESEARCH INTERN', year: "'25", short: "Samsung PRISM '25", org: 'R&D Research Intern' },
] as const;

// Kernel subsystems featured on the social card. Curated by hand, not derived
// from kernel-contributions.json — the card lists the areas Vidhu works in.
export const KERNEL_SUBSYSTEMS = ['IIO', 'eBPF', 'FS'] as const;
