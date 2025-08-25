import { useState,useEffect } from "react";
import { Modal, Form, Select, Button, Typography, message,Spin } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import axiosInstance from "../utils/axiosInstance";

const { Option } = Select;
const { Text } = Typography;

function DropView({open,connection, owner, onDrop, onCancel}) {
  const [form] = Form.useForm();
  const [views,setViews] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!owner || !connection) return;
    if (!open) return;

    const fetchViews = async () => {
      setLoading(true);
      try {
        const { data } = await axiosInstance.get(`/views/${owner}`, {
          params: {
            user: connection.user,
            password: connection.password,
            host: connection.host,
            service: connection.service,
          },
        });
        setViews(data || []);
      } catch (error) {
        console.error("Error fetching tables:", error);
        message.error("No se pudieron cargar las tablas");
      } finally {
        setLoading(false);
      }
    };

    fetchViews();
  }, [open]);

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        const viewName = values.tableName;
        onDrop(connection,owner,viewName);
        form.resetFields();
        onCancel();
      })
      .catch(() => {
        message.error("Selecciona una opción antes de continuar");
      });
  };

  return (
      <Modal
        title="Eliminar una vista"
        open={open}
        onOk={handleOk}
        onCancel={onCancel}
        okText="Aceptar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical">
          {loading ? (
            <Spin tip="Cargando tablas..." />
          ) : (
          <Form.Item
            name="tableName"
            label={<Text strong>Nombre del elemento</Text>}
            rules={[{ required: true, message: "Por favor selecciona uno" }]}
          >
            <Select placeholder="Selecciona un elemento">
              {views.map(v => (
                <Select.Option value={v}>
                  {v}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          )}
        </Form>
      </Modal>
  );
}

export default DropView;
