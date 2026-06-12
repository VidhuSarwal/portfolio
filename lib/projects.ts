export type Project = {
  id: string;
  index: string;
  category: string;
  year: string;
  title: string;
  description: string;
  tags: string[];
  caseStudyHref: string | null;
  liveHref: string | null;
  highlightedMesh: string;
  configKey: 'showSamsung' | 'showGSOC' | 'showLKMP' | null;
};

export const projects: Project[] = [
  {
    id: 'gsoc',
    index: '01',
    category: 'EMBEDDED LINUX · OPEN SOURCE',
    year: '2025',
    title: "GSoC '25 — BeagleBoard.org Linux Hardware Testing",
    description:
      'Selected from 40,000+ global applicants. Wrote production C/C++ for Linux-hosted hardware testing: I2C bus scan, EEPROM dispatch, and modular driver table for mikroBUS ClickID auto-detection. 30% performance improvement; patches CI-tested and upstreamed to mainline. Also shipped OpenCV HDMI validation, a live Mongoose HTTP results dashboard, MQTT via libmosquitto, and automated Buildroot cross-compiled CI.',
    tags: ['C', 'C++', 'Linux Kernel', 'I2C', 'Buildroot', 'MQTT', 'Mongoose'],
    caseStudyHref: 'https://gist.github.com/VidhuSarwal/8e8d9dd93fea9075428cc6320c3b0a4f',
    liveHref: null,
    highlightedMesh: 'expansion_connector',
    configKey: 'showGSOC',
  },
  {
    id: 'samsung',
    index: '02',
    category: 'AI INFRASTRUCTURE · 2025',
    year: '2025',
    title: 'Samsung PRISM — Enterprise Knowledge Synthesis Platform',
    description:
      'Sole owner of a 61k+ LOC production async Python platform. LangGraph multi-agent orchestration, hybrid BM25 + ChromaDB retrieval, Qwen-VL document parsing, and SQL-based spreadsheet querying. Cut end-to-end latency 70% via async redesign and dual-instance model parallelism. Adopted by multiple Samsung teams as an internal NotebookLM replacement.',
    tags: ['Python', 'LangGraph', 'ChromaDB', 'Qwen-VL', 'FastAPI', 'Socket.io'],
    caseStudyHref: null,
    liveHref: null,
    highlightedMesh: 'soc',
    configKey: 'showSamsung',
  },
  {
    id: 'vaultcrypt',
    index: '03',
    category: 'DISTRIBUTED SYSTEMS · 2025',
    year: '2025',
    title: 'VaultCrypt — Zero-Knowledge Distributed Storage',
    description:
      'Zero-knowledge distributed storage in Go. Shards files with ChaCha20-DRBG obfuscation across 4 chunking strategies, AES-256-GCM tokens at rest — server holds zero key material. 1,000+ concurrent ops at sub-500ms latency with strict subsystem isolation.',
    tags: ['Go', 'ChaCha20-DRBG', 'AES-256-GCM', 'MongoDB'],
    caseStudyHref: null,
    liveHref: null,
    highlightedMesh: 'mem_left',
    configKey: null,
  },
  {
    id: 'gitscope',
    index: '04',
    category: 'DEVELOPER TOOLS · 2025',
    year: '2025',
    title: 'GitScope — Codebase Intelligence Platform',
    description:
      'Turns GitHub repos into readable narratives. Tree-sitter AST parsing for per-function breakdowns across 50k+ lines, ChromaDB semantic search, and LLM-powered commit evolution summaries. Token-efficient caching to cut re-analysis cost on repeated queries.',
    tags: ['Python', 'FastAPI', 'Tree-sitter', 'ChromaDB', 'RAG'],
    caseStudyHref: null,
    liveHref: null,
    highlightedMesh: 'pin_header',
    configKey: null,
  },
  {
    id: 'sih',
    index: '05',
    category: 'AI · HACKATHON WINNER · 2024',
    year: '2024',
    title: 'ExpeRelate — AI Expert Recommendation Engine',
    description:
      'Smart India Hackathon 2024 National Winner (Team Lead, 10,000+ participants). Semantic query routing across 500+ domains; automated ingestion tripled the database to 5k+ profiles; sub-200ms API response under concurrent load. Built on FastAPI with embedding-based vector search.',
    tags: ['Python', 'FastAPI', 'Embeddings', 'Vector Search', 'NLP'],
    caseStudyHref: null,
    liveHref: null,
    highlightedMesh: 'pcb',
    configKey: null,
  },
];
