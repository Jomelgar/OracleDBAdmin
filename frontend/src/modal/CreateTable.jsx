import { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Select, Space, Checkbox, Typography, message } from 'antd';
import { PlusOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons';
import axiosInstance from '../utils/axiosInstance';

const { Paragraph } = Typography;

export default function CreateTableModal({ open, connection, owner, onCancel, onCreate }) {
  const [form] = Form.useForm();
  const [columnTypes, setColumnTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewSQL, setPreviewSQL] = useState('');

  useEffect(() => {
    if (open) {
      fetchColumnTypes();
    }
  }, [open]);

  const fetchColumnTypes = async () => {
    setLoadingTypes(true);
    try {
      const res = await axiosInstance.get('/data-types', {
        params: {
          user: connection.user,
          password: connection.password,
          host: connection.host,
          service: connection.service,
        },
      });
      const types =
        res.data?.rows?.map((r) => r[0]) ||
        [];
      setColumnTypes(types);
    } catch (err) {
      console.error('Error cargando tipos de datos:', err);
    } finally {
      setLoadingTypes(false);
    }
  };

  const generateSQL = (values) => {
    const { tableName, columns } = values;

    const needsSize = (type) => {
      const t = type.toUpperCase();
      return ['VARCHAR2', 'CHAR', 'NCHAR', 'NVARCHAR2'].includes(t);
    };

    const formatDefaultValue = (val, type) => {
      if (!val) return '';
      const t = type.toUpperCase();

      if (
        ['CHAR', 'VARCHAR2', 'NVARCHAR2', 'NCHAR', 'CLOB'].includes(t) ||
        t === 'DATE'
      ) {
        // Si es función de fecha o cadena entre comillas
        if (t === 'DATE' && /^[A-Z_]+\(\)$/.test(val.toUpperCase())) return val;
        if (/^'.*'$/.test(val)) return val;
        return `'${val}'`;
      }
      return val;
    };

    const colDefs = columns.map((col) => {
      let def = col.name + ' ' + col.type;

      if (needsSize(col.type) && !/\(\d+\)/.test(col.type)) {
        def += '(100)';
      }

      if (col.defaultValue) {
        def += ` DEFAULT ${formatDefaultValue(col.defaultValue, col.type)}`;
      }

      if (col.notNull) def += ' NOT NULL';

      if (col.primaryKey) {
        def += ' PRIMARY KEY';
      } else if (col.unique) {
        def += ' UNIQUE';
      }

      return def;
    });

    return `CREATE TABLE ${owner}.${tableName} (\n${colDefs.join(',\n')}\n)`;
  };



  // Mostrar preview modal con SQL generado
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

  // Confirmar creación y enviar SQL
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const sql = generateSQL(values);
      onCreate(connection, sql);
      form.resetFields();
      setPreviewVisible(false);
      onCancel();
    } catch (err) {
      console.log('Error en validación:', err);
    }
  };

  // Copiar SQL al portapapeles
  const copyToClipboard = () => {
    navigator.clipboard.writeText(previewSQL);
    message.success('SQL copiado al portapapeles');
  };

  return (
    <>
      <Modal
        open={open}
        title="Crear Nueva Tabla"
        okText="Crear"
        cancelText="Cancelar"
        onCancel={() => {
          form.resetFields();
          setPreviewVisible(false);
          onCancel();
        }}
        onOk={handleOk}
        width={900}
        footer={[
          <Button key="preview" onClick={showPreview}>
            Previsualizar SQL
          </Button>,
          <Button
            key="cancel"
            onClick={() => {
              form.resetFields();
              setPreviewVisible(false);
              onCancel();
            }}
          >
            Cancelar
          </Button>,
          <Button key="create" type="primary" onClick={handleOk}>
            Crear
          </Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            columns: [
              {
                name: '',
                type: '',
                notNull: false,
                unique: false,
                primaryKey: false,
              },
            ],
          }}
        >
          <Form.Item
            label="Nombre de la Tabla"
            name="tableName"
            rules={[{ required: true, message: 'Ingrese el nombre de la tabla' }]}
          >
            <Input placeholder="Ej. estudiantes" />
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
                      <Select
                        placeholder="Tipo"
                        style={{ width: 160 }}
                        loading={loadingTypes}
                        showSearch
                        optionFilterProp="children"
                      >
                        {columnTypes.map((type) => (
                          <Select.Option key={type} value={type}>
                            {type}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item {...restField} name={[name, 'defaultValue']}>
                      <Input placeholder="Valor por defecto" />
                    </Form.Item>

                    <Form.Item {...restField} name={[name, 'notNull']} valuePropName="checked">
                      <Checkbox>NOT NULL</Checkbox>
                    </Form.Item>

                    <Form.Item {...restField} name={[name, 'unique']} valuePropName="checked">
                      <Checkbox>UNIQUE</Checkbox>
                    </Form.Item>

                    <Form.Item {...restField} name={[name, 'primaryKey']} valuePropName="checked">
                      <Checkbox>PRIMARY KEY</Checkbox>
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
                  onClick={() =>
                    add({
                      name: '',
                      type: '',
                      notNull: false,
                      unique: false,
                      primaryKey: false,
                    })
                  }
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
          <Button key="copy" icon={<CopyOutlined />} onClick={copyToClipboard}>
            Copiar SQL
          </Button>,
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            Cerrar
          </Button>,
        ]}
        width={700}
      >
        <Paragraph
          style={{
            backgroundColor: '#f5f5f5',
            padding: '12px',
            borderRadius: '4px',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            fontSize: 14,
          }}
        >
          {previewSQL}
        </Paragraph>
      </Modal>
    </>
  );
}
