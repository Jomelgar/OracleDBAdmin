import { useState, useEffect } from "react";
import { Modal, Form, Select, Button, Typography, message, Spin } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import axiosInstance from "../utils/axiosInstance";

const { Text } = Typography;

function DropTable({ open, connection, owner, onDrop, onCancel }) {
  const [form] = Form.useForm();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!owner || !connection) return;
    if (!open) return;

    const fetchTables = async () => {
      setLoading(true);
      try {
        const { data } = await axiosInstance.get(`/tables/${owner}`, {
          params: {
            user: connection.user,
            password: connection.password,
            host: connection.host,
            service: connection.service,
          },
        });
        setTables(data || []);
      } catch (error) {
        console.error("Error fetching tables:", error);
        message.error("No se pudieron cargar las tablas");
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, [open]);

  const handleOk = async () => {
    try {
      await form.validateFields().then((values)=>{
        const tableName = values.tableName;
        onDrop(connection,owner,tableName);
        form.resetFields();
        onCancel();
      });
    } catch (error) {
      if (error?.errorFields) {
        message.error("Selecciona un elemento antes de continuar");
      } else {
        console.error(error);
        message.error("Ocurrió un error al eliminar la tabla");
      }
    }
  };

  return (
    <Modal
      title="Eliminar una tabla"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText="Aceptar"
      cancelText="Cancelar"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="tableName"
          label={<Text strong>Nombre del elemento</Text>}
          rules={[{ required: true, message: "Por favor selecciona uno" }]}
        >
          {loading ? (
            <Spin tip="Cargando vistas..." />
          ) : (
            <Select placeholder="Selecciona un elemento">
              {tables.map((t) => (
                <Select.Option key={t} value={t}>
                  {t}
                </Select.Option>
              ))}
            </Select>
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default DropTable;
