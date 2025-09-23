import { useEffect, useState } from "react";
import { Card, Spin, message } from "antd";
import axiosInstance from "../utils/axiosInstance";
import GraphDiagram from "./GraphDiagram";

function DiagramView({ owner, connection }) {
  const [tables, setTables] = useState([]);
  const [columns, setColumns] = useState({});
  const [relations, setRelations] = useState([]);
  const [loading, setLoading] = useState(true);

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

      console.log("📦 Datos recibidos:", res.data);

      if (res.data?.tables && res.data?.columns) {
        setTables(res.data.tables);
        setColumns(res.data.columns);
        setRelations(res.data.relations || []);
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
        <div style={{ width: "100%", height: "600px" }}>
          <GraphDiagram
            tables={tables}
            columns={columns}
            relations={relations}
          />
        </div>
      )}
    </Card>
  );
}

export default DiagramView;
