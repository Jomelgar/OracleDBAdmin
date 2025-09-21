import React, { useState } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import axios from "../utils/axiosInstance";

const MigratePostgresModal = ({ connection,visible, onClose, owner }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleMigrate = async (values) => {
    setLoading(true);
    try {
      console.log(connection);
      // Llamada a tu endpoint POST de migración
      const response = await axios.post(`/migration/${owner}`, {
        user: connection.user,
        host: connection.host,
        service: connection.service,
        password: connection.password,
        ...values, // contiene pgUser, pgPassword, pgHost, pgPort, pgDatabase
      });
      message.success(response.data.message || "Migración completada!");
      onClose();
    } catch (err) {
      message.error(err.response?.data?.error || "Error en la migración");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      title={`Migrar esquema "${owner}" a PostgreSQL`}
      onCancel={onClose}
      footer={null}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleMigrate}
        initialValues={{ pgPort: 5432 }}
      >
        <Form.Item
          label="Usuario PostgreSQL"
          name="pgUser"
          rules={[{ required: true, message: "Ingrese el usuario" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Contraseña PostgreSQL"
          name="pgPassword"
          rules={[{ required: true, message: "Ingrese la contraseña" }]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          label="Host PostgreSQL"
          name="pgHost"
          rules={[{ required: true, message: "Ingrese el host" }]}
        >
          <Input placeholder="127.0.0.1" />
        </Form.Item>

        <Form.Item
          label="Puerto PostgreSQL"
          name="pgPort"
          rules={[{ required: true, message: "Ingrese el puerto" }]}
        >
          <Input placeholder="5432" />
        </Form.Item>

        <Form.Item
          label="Base de datos PostgreSQL"
          name="pgDatabase"
          rules={[{ required: true, message: "Ingrese la base de datos" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Migrar
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default MigratePostgresModal;
