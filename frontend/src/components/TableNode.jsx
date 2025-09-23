import { Handle, Position } from "reactflow";

function TableNode({ data }) {
  return (
    <div className="rounded-lg shadow-md bg-white border border-gray-300">
      {/* Encabezado de la tabla */}
      <div className="bg-red-500 text-white px-2 py-1 font-bold rounded-t-lg">
        {data.label}
      </div>

      {/* Columnas */}
      <div className="p-2">
        {data.columns.map((col, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between text-sm py-0.5"
          >
            {/* Handle izquierdo (entrada) */}
            <Handle
              type="target"
              position={Position.Left}
              id={`${data.id}`}
              style={{ top: 20 + idx * 20 }}
            />

            {/* Nombre de columna */}
            <span>
              <strong>{col.name}: </strong>
              {col.type}
              {col.pk && " (PK 🔑)"}
              {col.fk && " (FK 🔗)"}
            </span>

            {/* Handle derecho (salida) */}
            <Handle
              type="source"
              position={Position.Right}
              id={`${data.id}`}
              style={{ top: 20 + idx * 20 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default TableNode;
