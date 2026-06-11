export type Experience = {
  id: string;
  company: string;
  role: string;
  dateRange: string;
  year: string;
  description: string;
  tags: string[];
  logoSlug: string;
  configKey: 'showSamsung' | 'showGSOC' | 'showLKMP' | null;
};

export const experiences: Experience[] = [
  {
    id: 'samsung',
    company: 'Samsung R&D',
    role: 'Research Intern — AI Infrastructure',
    dateRange: 'Jan 2025 – Jun 2025',
    year: '2025',
    description:
      'Built a multimodal RAG platform for internal knowledge retrieval across 61k LOC. Multi-agent LangGraph orchestration with hybrid BM25 + vector retrieval. Adopted by multiple Samsung teams post-internship.',
    tags: ['Python', 'LangGraph', 'ChromaDB', 'Qwen-VL'],
    logoSlug: 'samsung',
    configKey: 'showSamsung',
  },
  {
    id: 'gsoc',
    company: 'Google Summer of Code',
    role: 'Open Source Contributor — BeagleBoard.org',
    dateRange: 'May 2025 – Present',
    year: '2025',
    description:
      'Upstreaming embedded Linux drivers and board support packages into the mainline kernel under mentor review. Patches touch DTS, driver subsystems, and LKML submission workflow.',
    tags: ['C', 'Linux Kernel', 'Device Tree', 'ARM'],
    logoSlug: 'gsoc',
    configKey: 'showGSOC',
  },
  {
    id: 'lkmp',
    company: 'Linux Foundation',
    role: 'Mentee — Linux Kernel Mentorship Program',
    dateRange: 'Sep 2024 – Dec 2024',
    year: '2024',
    description:
      'Linux Kernel Mentorship Program cohort. Contributed to kernel subsystems, triaged bug reports, and submitted fixes through the standard kernel contribution workflow.',
    tags: ['C', 'Linux Kernel', 'Git', 'Kernel Debugging'],
    logoSlug: 'linux',
    configKey: 'showLKMP',
  },
];
