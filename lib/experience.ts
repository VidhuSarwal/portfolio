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
    id: 'lkmp',
    company: 'Linux Foundation',
    role: 'Kernel Developer Mentee — LFX Mentorship',
    dateRange: 'Jun 2026 – Present',
    year: '2026',
    description:
      'Selected for the Linux Kernel Mentorship Program under maintainer mentorship. Contributing to kernel bug triage, fixes, and upstream patch submission — building on mainline-upstreamed work from Google Summer of Code.',
    tags: ['C', 'Linux Kernel', 'Git', 'Patch Workflow', 'LKML'],
    logoSlug: 'linux',
    configKey: 'showLKMP',
  },
  {
    id: 'gsoc',
    company: 'Google Summer of Code',
    role: 'Open Source Software Engineering Intern — BeagleBoard.org',
    dateRange: 'Jun 2025 – Sep 2025',
    year: '2025',
    description:
      'Selected from 40,000+ global applicants. Wrote production C/C++ for Linux-hosted hardware testing: I2C bus scan, EEPROM dispatch, mikroBUS ClickID auto-detection. 30% performance improvement; patches CI-tested and upstreamed to mainline with DCO sign-off.',
    tags: ['C', 'C++', 'I2C', 'Linux', 'Buildroot', 'MQTT', 'Mongoose'],
    logoSlug: 'gsoc',
    configKey: 'showGSOC',
  },
  {
    id: 'samsung',
    company: 'Samsung R&D',
    role: 'Research Intern — AI Infrastructure (PRISM)',
    dateRange: 'Jan 2025 – Feb 2026',
    year: '2025',
    description:
      'Sole owner of a 61k+ LOC production async Python platform: LangGraph multi-agent orchestration, hybrid BM25 + ChromaDB retrieval, Qwen-VL document parsing, SQL spreadsheet querying. Cut end-to-end latency 70% via async redesign. Adopted by multiple Samsung teams as an internal NotebookLM replacement.',
    tags: ['Python', 'LangGraph', 'ChromaDB', 'Qwen-VL', 'React', 'Socket.io'],
    logoSlug: 'samsung',
    configKey: 'showSamsung',
  },
  {
    id: 'sentinal',
    company: 'Sentinal Innovations',
    role: 'Engineering Intern — Embedded Systems & IoT',
    dateRange: 'Jun 2024 – Aug 2024',
    year: '2024',
    description:
      'Built ESP32 firmware in Embedded C for an IoT relay control system with a real-time monitoring dashboard. Shipped to 50+ homes, cutting energy use 25%. Designed a clean firmware API layer keeping hardware and application layers independently deployable.',
    tags: ['Embedded C', 'ESP32', 'MQTT', 'IoT', 'FreeRTOS'],
    logoSlug: 'sentinal',
    configKey: null,
  },
];
