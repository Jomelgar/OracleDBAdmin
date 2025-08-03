import { useState, useEffect, useRef } from "react";
import { Button, Input, Select, message, Upload,Modal } from "antd";
import Cookies from 'js-cookie';
import axiosInstance from '../utils/axiosInstance';
import { ExportOutlined, ImportOutlined, PlayCircleOutlined,InboxOutlined} from "@ant-design/icons";
import OutputTable from './OutputTable';

function EditorView({ content = "", onChange }) {
  const [api, contextHolder] = message.useMessage();
  const [text, setText] = useState(content);
  const [lines, setLines] = useState(1);
  const textareaRef = useRef(null);
  const lineNumberRef = useRef(null);
  const [output, setOutput] = useState("");
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  useEffect(() => {
    setLines(text.split("\n").length);
  }, [text]);

  const handleExport = () => {
    if (!text || text.trim() === "") {
      api.warning({
        content: "⚠️ WARNING: No content to export",
        duration: 3,
      });
      return;
    }

    const blob = new Blob([text], { type: "text/sql;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "query.sql");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    setImportModalOpen(true);
  };

  const handleChange = (e) => {
    setText(e.target.value);
    if (onChange) onChange(e.target.value);
  };

  const handleScroll = () => {
    if (lineNumberRef.current && textareaRef.current) {
      lineNumberRef.current.scrollTop = textareaRef.current.resizableTextArea.textArea.scrollTop;
    }
  };

  const runCode = async () => {
    if (!selectedConnection) {
      api.warning("⚠️ WARNING: Select a connection before to execute.");
      return;
    }
    try {
      const queries = text.split(';').map(q => q.trim()).filter(q => q !== '');
      let finalResult = null;
      for (const query of queries) {
        const response = await axiosInstance.post('/query', {
          host: selectedConnection.host,
          user: selectedConnection.user,
          password: selectedConnection.password,
          service: selectedConnection.service,
          query: query,
        });
        finalResult = response;
      }
      if (finalResult?.data) {
        setOutput(
          <OutputTable data={finalResult.data || []} meta={finalResult.data?.metaData} />
        );
      } else {
        setOutput("✅ Query(s) executed without errors, but without output data.");
      }
    } catch (err) {
      let errorMsg = "❌ Error:\n";
      if (err.response && err.response.data) {
        errorMsg += JSON.stringify(err.response.data.error, null, 2);
      } else if (err.message) {
        errorMsg += err.message;
      } else {
        errorMsg += err.toString();
      }
      setOutput(errorMsg);
    }
  };

  const lineNumbers = Array.from({ length: lines }, (_, i) => i + 1);
  const lineHeight = 24;

  const connections = Cookies.get("oracleConnections")
    ? JSON.parse(Cookies.get("oracleConnections"))
    : [];


  const draggerProps = {
    name: "file",
    multiple: false,
    accept: ".sql,.txt",
    beforeUpload: (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setText(e.target.result);
        setImportModalOpen(false);
        api.success("📄 Archivo cargado correctamente!");
      };
      reader.onerror = () => {
        api.error("❌ Error leyendo el archivo.");
      };
      reader.readAsText(file);
      return false;
    },
    onDrop(e) {
    },
  };

  return (
    <>
      {contextHolder}
      <div className="flex flex-col border rounded-2xl shadow-sm overflow-hidden bg-white min-h-[400px]">

        {/* Selector de conexión y botones */}
        <div className="flex items-center justify-between px-5 py-2 border-b bg-gray-50">
          <Select
            className="min-w-[250px]"
            placeholder="Select Connection"
            value={selectedConnection ? selectedConnection.host + '/' +
              selectedConnection.service + '-' + selectedConnection.user : undefined}
            onChange={(key) => {
              const selected = connections.find(item => 
                item.host + '/' + item.service + '-' + item.user === key);
              setSelectedConnection(selected);
            }}
          >
            {connections.map((item) => (
              <Select.Option
                key={item.host + '/' + item.service + '-' + item.user}
                value={item.host + '/' + item.service + '-' + item.user}
              >
                {item.host}/{item.service} - {item.user}
              </Select.Option>
            ))}
          </Select>
          
          {/*Botones*/}
          <div className="flex items-center gap-x-4">
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={runCode}
              size="middle"
              className="bg-red-700 hover:!bg-white hover:!text-red-500 hover:!border-red-500"
            >
              Execute
            </Button>
            <Button
              type="primary"
              icon={<ExportOutlined />}
              onClick={handleExport}
              size="middle"
              className="bg-red-700 hover:!bg-white hover:!text-red-500 hover:!border-red-500"
            >
              Export
            </Button>
            <Button
              type="primary"
              icon={<ImportOutlined />}
              size="middle"
              onClick={handleImport}
              className="bg-red-700 hover:!bg-white hover:!text-red-500 hover:!border-red-500"
            >
              Import
            </Button>
          </div>
        </div>

       {/* Editor con líneas */}
        <div
          className="flex flex-1 bg-white border rounded overflow-hidden"
          style={{ minHeight: 220, maxHeight: 500, overflowY: "auto" }}
        >
          <div
            ref={lineNumberRef}
            className="bg-gray-100 text-gray-400 font-mono text-sm border-r border-gray-300 select-none"
            style={{
              width: "3rem",
              lineHeight: `${lineHeight}px`,
              paddingTop: 8,
              paddingBottom: 8,
              userSelect: "none",
            }}
          >
            {lineNumbers.map((num) => (
              <div key={num} style={{ height: lineHeight, paddingLeft: 8 }}>
                {num}
              </div>
            ))}
          </div>

          <Input.TextArea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onScroll={handleScroll}
            autoSize={{ minRows: 10 }}
            placeholder="Escribe tu código SQL aquí..."
            className="font-mono text-gray-800 text-sm p-3 resize-none flex-1 border-none outline-none bg-white"
            style={{
              lineHeight: `${lineHeight}px`,
              height: "auto",
            }}
          />
        </div>
        {/* Salida */}
        <div className="border-t bg-gray-100 text-gray-800 font-mono text-sm p-4 overflow-auto min-h-[100px]">
          {output || "📝 Here will appear the output..."}
        </div>
      </div>
      {/* Modal para importar archivo */}
        <Modal
          title="Importar archivo SQL"
          open={importModalOpen}
          onCancel={() => setImportModalOpen(false)}
          footer={null}
          destroyOnClose
        >
          <Upload.Dragger {...draggerProps} style={{ padding: "20px" }}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined className="!text-red-500"/>
            </p>
            <p className="ant-upload-text">
              Drag and drop an SQL file here, or click to select
            </p>
            <p className="ant-upload-hint">
              Supported: files .sql y .txt (only one file)
            </p>
          </Upload.Dragger>
        </Modal>
    </>
  );
}

export default EditorView;
