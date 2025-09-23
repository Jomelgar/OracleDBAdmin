import React, { useCallback } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import TableNode from "./TableNode";

const nodeTypes = { tableNode: TableNode };

function GraphDiagram({ tables, columns, relations }) {
  
  const initialNodes = tables.map((table, i) => ({
    id: table,
    type: "tableNode",
    data: {
      label: table,
      columns: columns[table] || [],
      id: table,
    },
    position: { x: (i % 4) * 280, y: Math.floor(i / 4) * 220 },
  }));

  const initialEdges = relations.map((rel, i) => ({
    id: `e${i}`,
    source: `${rel.parent}`,
    target: `${rel.child}`,
    label: `${rel.parent + '.' + rel.parentColumn} → ${rel.child + '.'+rel.childColumn}`,
    type: "smoothstep",
    animated: true,
  }));

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);


  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        fitView
        panOnScroll
        zoomOnScroll
        nodesDraggable
        nodesConnectable={false}
        snapToGrid
        snapGrid={[20, 20]}
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <MiniMap zoomable pannable />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default GraphDiagram;
