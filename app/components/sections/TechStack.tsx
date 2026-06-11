const clusters = [
  {
    label: 'SYSTEMS',
    position: 'top-left',
    nodes: ['C', 'C++', 'Linux Kernel', 'Buildroot', 'Embedded C', 'ARM', 'I2C/SPI/UART', 'Device Tree'],
  },
  {
    label: 'BACKEND',
    position: 'top-right',
    nodes: ['Go', 'Python', 'FastAPI', 'async', 'WebSockets', 'REST', 'gRPC'],
  },
  {
    label: 'AI / ML',
    position: 'bottom-right',
    nodes: ['LangGraph', 'LangChain', 'ChromaDB', 'RAG', 'Embeddings', 'Qwen-VL', 'Tree-sitter'],
  },
  {
    label: 'INFRA',
    position: 'bottom-left',
    nodes: ['Docker', 'Kubernetes', 'GitHub Actions', 'PostgreSQL', 'MongoDB', 'Redis'],
  },
];

export default function TechStack() {
  return (
    <section
      id="tech-stack"
      aria-labelledby="tech-heading"
      className="section-gap"
    >
      <div className="content-grid">
        <div className="col-span-12" style={{ marginBottom: '64px' }}>
          <p className="text-mono" style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            05 / STACK
          </p>
          <h2 id="tech-heading" className="text-section" style={{ color: 'var(--text-primary)' }}>
            Technologies
          </h2>
        </div>

        {clusters.map((cluster) => (
          <div key={cluster.label} className="col-span-12 sm:col-span-6 lg:col-span-3">
            <p
              className="text-mono"
              style={{ color: 'var(--accent)', marginBottom: '20px' }}
            >
              {cluster.label}
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {cluster.nodes.map((node) => (
                <li
                  key={node}
                  className="text-mono"
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    letterSpacing: '0.1em',
                    cursor: 'default',
                    transition: 'color 0.15s',
                  }}
                >
                  {node}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
