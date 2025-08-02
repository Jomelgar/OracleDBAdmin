import { useState, useEffect, useRef } from "react";
import { Button, Input, Select } from "antd";
import Cookies from 'js-cookie';
import axiosInstance from '../utils/axiosInstance';
import { PlayCircleOutlined } from "@ant-design/icons";
import OutputTable from './OutputTable';
import Password from "antd/es/input/Password";

function EditorView({ content = "", onChange }) {
  const [text, setText] = useState(content);
  const [lines, setLines] = useState(1);
  const textareaRef = useRef(null);
  const lineNumberRef = useRef(null);
  const [output, setOutput] = useState("");
  const [selectedConnection, setSelectedConnection] = useState(null);

  useEffect(() => {
    const lineCount = text.split("\n").length;
    setLines(lineCount);
  }, [text]);

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
    try {
      console.log(selectedConnection);
      const result = await axiosInstance.post('/query', {
        host: selectedConnection.host,
        user: selectedConnection.user,
        password: selectedConnection.password,
        service: selectedConnection.service,
        query: text,
      });
      setOutput(<OutputTable data={result?.data || []} meta={result.data?.metaData}/>);
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

  return (
    <div className="flex flex-col border rounded-2xl shadow-sm overflow-hidden bg-white min-h-[400px]">
      
      {/* Selector de conexión */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
        <Select
          className="min-w-[250px]"
          placeholder="Seleccionar conexión"
          value={selectedConnection ? selectedConnection.host + '/' +
             selectedConnection.service + '-' + selectedConnection.user : undefined}
          onChange={(key) => {
            const selected = connections.find(item => item.host + '/' + item.service + '-' + item.user === key);
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
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={runCode}
          size="middle"
          className="bg-red-700 hover:!bg-white hover:!text-red-500 hover:!border-red-500"
        >
          Ejecutar
        </Button>
      </div>

      {/* Editor con líneas */}
      <div className="flex flex-1 overflow-hidden bg-white" style={{ minHeight: 220 }}>
        <div
          ref={lineNumberRef}
          className="bg-gray-100 text-gray-400 font-mono text-sm border-r border-gray-300 select-none overflow-y-auto"
          style={{
            width: "3rem",
            lineHeight: `${lineHeight}px`,
            paddingTop: 8,
            paddingBottom: 8
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
          className="font-mono text-gray-800 text-sm p-3 resize-none"
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            lineHeight: `${lineHeight}px`,
            backgroundColor: "white"
          }}
        />
      </div>

      {/* Salida */}
      <div className="border-t bg-gray-100 text-gray-800 font-mono text-sm p-4 overflow-auto min-h-[100px]">
        {output || "📝 Aquí se mostrará la salida al ejecutar..."}
      </div>
    </div>
  );
}

export default EditorView;
