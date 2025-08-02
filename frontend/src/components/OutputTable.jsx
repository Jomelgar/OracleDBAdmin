import React from "react";
import { Table } from "antd";

function OutputTable({ data = {}, meta = [] }) {
  const rows = data.rows || [];

  if (!rows.length) {
    return (
      <div className="p-4 text-center text-gray-500 bg-gray-50 rounded">
        Return 0 rows
      </div>
    );
  }

  // Crear columnas para la tabla desde meta
  const columns = meta.map((col) => ({
    title: col.name,
    dataIndex: col.name,
    key: col.name,
  }));

  // Mapear rows (array de arrays) a objetos con nombres desde meta
  const formattedData = rows.map((row, index) => {
    const obj = {};
    meta.forEach((col, colIndex) => {
      obj[col.name] = row[colIndex];
    });
    return { ...obj, _index: index }; // usar _index como rowKey si querés
  });

  return (
    <div className="bg-white rounded shadow p-4 overflow-auto">
      <Table
        dataSource={formattedData}
        columns={columns}
        pagination={{position: ["bottomCenter"], pageSize: 15 }}
        rowKey="_index"
        size="middle"
        bordered
      />
    </div>
  );
}

export default OutputTable;
