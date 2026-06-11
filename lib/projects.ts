export type Project = {
  id: string;
  index: string;
  category: string;
  year: string;
  title: string;
  description: string;
  tags: string[];
  caseStudyHref: string | null;
  highlightedMesh: string;
  configKey: 'showSamsung' | 'showGSOC' | 'showLKMP' | null;
};

export const projects: Project[] = [
  {
    id: 'gsoc',
    index: '01',
    category: 'EMBEDDED LINUX · OPEN SOURCE',
    year: '2025',
    title: 'GSoC \'25 — Embedded Linux Mainline Patches',
    description:
      'Google Summer of Code at BeagleBoard.org. Upstreaming device drivers and board support into the Linux mainline kernel. Work spans DTS authoring, driver debugging, and patch submission to LKML under mentor review.',
    tags: ['C', 'Linux Kernel', 'Device Tree', 'LKML', 'ARM'],
    caseStudyHref: null,
    highlightedMesh: 'expansion_connector',
    configKey: 'showGSOC',
  },
  {
    id: 'samsung',
    index: '02',
    category: 'AI INFRASTRUCTURE · 2025',
    year: '2025',
    title: 'Samsung PRISM — Multimodal Enterprise Knowledge Synthesis',
    description:
      'Async Python platform handling 61k LOC of internal documentation. LangGraph multi-agent orchestration, hybrid retrieval (ChromaDB + BM25), Qwen-VL document parsing. Adopted by multiple Samsung teams.',
    tags: ['Python', 'LangGraph', 'ChromaDB', 'Qwen-VL', 'FastAPI'],
    caseStudyHref: null,
    highlightedMesh: 'soc',
    configKey: 'showSamsung',
  },
  {
    id: 'vaultcrypt',
    index: '03',
    category: 'DISTRIBUTED SYSTEMS · 2024',
    year: '2024',
    title: 'VaultCrypt — Distributed Encrypted Storage',
    description:
      'Distributed storage system written in Go. Erasure-coded sharding across nodes, AES-256-GCM encryption at rest, consistent hashing for shard placement. Benchmarked at 800 MB/s sequential write on a 4-node cluster.',
    tags: ['Go', 'gRPC', 'AES-256', 'Erasure Coding', 'Consistent Hashing'],
    caseStudyHref: null,
    highlightedMesh: 'mem_left',
    configKey: null,
  },
  {
    id: 'gitscope',
    index: '04',
    category: 'DEVELOPER TOOLS · 2024',
    year: '2024',
    title: 'GitScope — Codebase Intelligence',
    description:
      'Static analysis tool for large codebases. Tree-sitter AST parsing, semantic call-graph construction, and natural-language query interface backed by embedding search. Processes 100k-line repos in under 8 seconds.',
    tags: ['Python', 'Tree-sitter', 'Embeddings', 'RAG', 'PostgreSQL'],
    caseStudyHref: null,
    highlightedMesh: 'pin_header',
    configKey: null,
  },
  {
    id: 'sih-esp32',
    index: '05',
    category: 'IOT · EMBEDDED · 2024',
    year: '2024',
    title: 'SIH 2024 + ESP32 IoT Relay Infrastructure',
    description:
      'Smart India Hackathon finalist. Mesh-networked ESP32 relay nodes with MQTT broker, OTA firmware update pipeline, and a React dashboard for real-time telemetry. Deployed across a 12-node test environment.',
    tags: ['C', 'ESP32', 'MQTT', 'FreeRTOS', 'React'],
    caseStudyHref: null,
    highlightedMesh: 'pcb',
    configKey: null,
  },
];
