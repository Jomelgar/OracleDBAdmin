import React from "react";
import { Table } from "antd";

function OutputTable({ data = {}, meta = [] }) {
  const rows = data.rows || [];

  const columns = meta.map((col) => ({
    title: col.name,
    dataIndex: col.name,
    key: col.name,
  }));

  const formattedData = rows.map((row, index) => {
    const obj = {};
    meta.forEach((col, colIndex) => {
      obj[col.name] = row[colIndex];
    });
    return { ...obj, _index: index };
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
