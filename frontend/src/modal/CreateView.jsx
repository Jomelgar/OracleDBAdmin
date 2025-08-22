import { useState } from 'react';
import { Modal, Form, Input, Select, Button, Space, Checkbox, Typography, message } from 'antd';
import { PlusOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons';

const { Paragraph } = Typography;

export default function CreateViewModal({ open, connection,owner, onCancel, onCreate }) {
  const [form] = Form.useForm();
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewSQL, setPreviewSQL] = useState('');
  const [columnTypes] = useState([
    'NUMBER', 'VARCHAR2', 'CHAR', 'DATE', 'CLOB', 'BLOB', 'NVARCHAR2', 'NCHAR'
  ]);

  const generateSQL = (values) => {
    const { viewName, columns } = values;

    const needsQuote = (type) =>
      ['VARCHAR2', 'CHAR', 'NVARCHAR2', 'NCHAR', 'CLOB'].includes(type.toUpperCase());

    const selectParts = columns.map(col => {
      let val = needsQuote(col.type) ? "''" : 'NULL'; // valor dummy según tipo
      if (col.type.toUpperCase() === 'DATE') val = 'SYSDATE';
      return `${val} AS ${col.name}`;
    });

    return `CREATE OR REPLACE VIEW ${owner}.${viewName} AS\nSELECT\n  ${selectParts.join(',\n  ')}\nFROM dual`;
  };

  const showPreview = async () => {
    try {
      const values = await form.validateFields();
      const sql = generateSQL(values);
      setPreviewSQL(sql);
      setPreviewVisible(true);
    } catch (err) {
      console.log('Error validando para preview:', err);
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      // Enviar todos los datos de la vista al callback
      onCreate(connection,generateSQL(values));
      form.resetFields();
      setPreviewVisible(false);
      onCancel();
    } catch (err) {
      console.log('Error en validación:', err);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(previewSQL);
    message.success('SQL copiado al portapapeles');
  };

  return (
    <>
      <Modal
        open={open}
        title="Crear Nueva Vista"
        width={900}
        onCancel={() => { form.resetFields(); setPreviewVisible(false); onCancel(); }}
        footer={[
          <Button key="preview" onClick={showPreview}>Previsualizar SQL</Button>,
          <Button key="cancel" onClick={() => { form.resetFields(); setPreviewVisible(false); onCancel(); }}>Cancelar</Button>,
          <Button key="create" type="primary" onClick={handleOk}>Crear</Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ columns: [{ name: '', type: 'VARCHAR2', notNull: false, unique: false }] }}
        >
          <Form.Item
            label="Nombre de la Vista"
            name="viewName"
            rules={[{ required: true, message: 'Ingrese el nombre de la vista' }]}
          >
            <Input placeholder="Ej. vista_estudiantes" />
          </Form.Item>

          <Form.List name="columns">
            {(fields, { add, remove }) => (
              <>
                <label className="font-medium text-gray-700 mb-2 block">Columnas</label>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} align="start" style={{ display: 'flex', marginBottom: 8 }} wrap>
                    <Form.Item
                      {...restField}
                      name={[name, 'name']}
                      rules={[{ required: true, message: 'Nombre requerido' }]}
                    >
                      <Input placeholder="Nombre de columna" />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'type']}
                      rules={[{ required: true, message: 'Tipo requerido' }]}
                    >
                      <Select placeholder="Tipo" style={{ width: 150 }}>
                        {columnTypes.map(t => <Select.Option key={t} value={t}>{t}</Select.Option>)}
                      </Select>
                    </Form.Item>

                    <Form.Item {...restField} name={[name, 'notNull']} valuePropName="checked">
                      <Checkbox>NOT NULL</Checkbox>
                    </Form.Item>

                    <Form.Item {...restField} name={[name, 'unique']} valuePropName="checked">
                      <Checkbox>UNIQUE</Checkbox>
                    </Form.Item>

                    {fields.length > 1 && (
                      <DeleteOutlined
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                        onClick={() => remove(name)}
                        style={{ marginTop: 6 }}
                      />
                    )}
                  </Space>
                ))}

                <Button
                  type="dashed"
                  onClick={() => add({ name: '', type: 'VARCHAR2', notNull: false, unique: false })}
                  icon={<PlusOutlined />}
                  block
                >
                  Agregar columna
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      <Modal
        title="Previsualización SQL"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="copy" icon={<CopyOutlined />} onClick={copyToClipboard}>Copiar SQL</Button>,
          <Button key="close" onClick={() => setPreviewVisible(false)}>Cerrar</Button>,
        ]}
        width={700}
      >
        <Paragraph style={{
          backgroundColor: '#f5f5f5',
          padding: '12px',
          borderRadius: '4px',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace',
          fontSize: 14,
        }}>
          {previewSQL}
        </Paragraph>
      </Modal>
    </>
  );
}
