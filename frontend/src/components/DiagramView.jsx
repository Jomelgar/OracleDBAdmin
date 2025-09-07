import { useEffect, useState } from "react";
import { Card, Spin, message } from "antd";
import MermaidDiagram from "./MermaidDiagram";
import axiosInstance from "../utils/axiosInstance";

function DiagramView({ owner, connection }) {
  const [chart, setChart] = useState("");
  const [loading, setLoading] = useState(true);

  console.log(connection);

  const fetchDiagram = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.post("/erd", {
        user: connection.user,
        password: connection.password,
        host: connection.host,
        service: connection.service,
        owner: owner,
      });
      
      if (res.data?.mermaid) {
        setChart(res.data.mermaid);
      } else {
        message.error("No se pudo generar el diagrama");
      }
    } catch (err) {
      console.error("Error obteniendo ERD:", err);
      message.error("Error al cargar diagrama");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagram();
  }, [owner]);

  return (
    <Card
      title={`Esquema de ${owner}`}
      className="h-full overflow-auto"
      style={{ width: "100%", minHeight: "500px" }}
    >
      {loading ? (
        <div className="flex justify-center items-center h-96">
          <Spin size="large" />
        </div>
      ) : (
        <MermaidDiagram chart={chart} />
      )}
    </Card>
  );
}

export default DiagramView;
