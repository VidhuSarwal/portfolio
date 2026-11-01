import contributionsData from '@/data/kernel-contributions.json';
import { patchCount, type KernelContribution } from '@/app/kernel/kernel';

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

// Newest first — the current role leads the horizontal scroll, older work
// follows. Kernel figures are derived from the patch log so the card never
// drifts from /kernel.
const kernel = (contributionsData as { contributions: KernelContribution[] }).contributions;
const kernelSent     = patchCount(kernel);
const kernelAccepted = patchCount(kernel.filter((c) => c.status === 'merged'));

export const experiences: Experience[] = [
  {
    id: 'nexigence',
    company: 'Nexigence AI',
    role: 'Platform Engineering Lead — Systems · Infrastructure',
    dateRange: 'Oct 2026 – Present',
    year: '2026',
    // Product is under NDA — keep this to scope and responsibilities only.
    description:
      'Architecting the Linux platform layer of an early-stage operating system: system design, kernel and host configuration, isolation, networking and performance. Leading platform engineering end to end, from core architecture decisions to the build and CI infrastructure the team ships on.',
    tags: ['Linux', 'Systems Architecture', 'Kernel', 'Networking', 'CI/CD'],
    logoSlug: 'nexigence',
    configKey: null,
  },
  {
    id: 'lkmp',
    company: 'Linux Foundation',
    role: 'Kernel Developer — LFX · Linux Kernel',
    dateRange: 'Jun 2026 – Present',
    year: '2026',
    description:
      `${kernelSent} patches sent upstream through review on lore.kernel.org, ${kernelAccepted} accepted across IIO sensor drivers, staging and the NTFS3 filesystem, some backported to stable. Wrote a new IIO driver for the Benewake TF-Luna LiDAR over I2C, tested on a Raspberry Pi 4 — the 3-patch series is in review. Fixed an am2315 bug that read -0.1 °C as -3276.7.`,
    tags: ['C', 'Linux Kernel', 'IIO', 'Device Tree', 'I2C', 'LKML'],
    logoSlug: 'linux',
    configKey: 'showLKMP',
  },
  {
    id: 'gsoc',
    company: 'Google Summer of Code',
    role: 'Software Engineering Intern — BeagleBoard.org · Open Source',
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
