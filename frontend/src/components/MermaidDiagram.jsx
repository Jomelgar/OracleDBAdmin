import { useEffect, useRef } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false, // control manual
  theme: "base", // 'base' permite personalizar todos los colores
  themeVariables: {
    primaryColor: "#ffdddd",     // color de fondo de tablas (rojo claro)
    primaryTextColor: "#660000", // texto de tablas (rojo oscuro)
    lineColor: "#ff0000",        // líneas de relación (rojo)
    border1: "#990000",          // borde de tablas
  },
});

function MermaidDiagram({ chart }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!chart || !containerRef.current) return;

    const renderMermaid = async () => {
      try {
        containerRef.current.innerHTML = "";

        // Genera ID único
        const id = "mermaid-" + Math.random().toString(36).substr(2, 9);

        // Renderiza SVG
        const { svg } = await mermaid.render(id, chart);
        containerRef.current.innerHTML = svg;

        // Forzar re-render para que se dibujen relaciones
        mermaid.init(undefined, containerRef.current);
      } catch (err) {
        containerRef.current.innerHTML = `<pre style="color:red;">${err.message}</pre>`;
        console.error("Mermaid render error:", err);
      }
    };

    renderMermaid();
  }, [chart]);

  return <div ref={containerRef} className="mermaid w-full h-full overflow-auto" />;
}

export default MermaidDiagram;
