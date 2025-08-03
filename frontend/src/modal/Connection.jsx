import { Modal, Form, Input, Button } from 'antd';
import { useState } from 'react';

function ConnectionModal({ open, onClose, onConnect }) {
  const [form] = Form.useForm();
  const [error,setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const result = await onConnect(values);
      setLoading(false);
      if(result) onClose();
      else setError(true);
    } catch (error) {
      setLoading(false);
      console.error('Error en validación o conexión', error);
    }
  };

  return (
    <Modal
      open={open}
      title="Conectar a OracleDB"
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancelar
        </Button>,
        <Button key="connect" type="primary" loading={loading} onClick={handleConnect}>
          Conectar
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          host: 'localhost:1521',
          service: 'XEPDB1',
        }}
      >
        <Form.Item
          label="Usuario"
          name="user"
          rules={[{ required: true, message: 'Por favor ingrese el usuario' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Contraseña"
          name="password"
          rules={[{ required: true, message: 'Por favor ingrese la contraseña' }]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          label="Host"
          name="host"
          rules={[{ required: true, message: 'Por favor ingrese el host' }]}
        >
          <Input placeholder="Ej: localhost:1521" />
        </Form.Item>

        <Form.Item
          label="Servicio"
          name="service"
          rules={[{ required: true, message: 'Por favor ingrese el servicio' }]}
        >
          <Input placeholder="Ej: XEPDB1" />
        </Form.Item>
      </Form>
      {error && (
        <text className='text-red-500 text-center'>
          No se aceptaron esas credenciales para conectarse a una base de datos de Oracle.
        </text>
      )}
    </Modal>
  );
}

export default ConnectionModal;
