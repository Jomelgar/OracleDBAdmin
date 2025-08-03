import { Button, Layout, Tree, Typography, Divider} from 'antd';
import Cookies from "js-cookie";
import {
  PlusCircleOutlined
} from '@ant-design/icons';
import { getTree } from '../api/getTree';
import { useEffect, useState } from 'react';
import ConnectionModal from '../modal/Connection';
import axiosInstance from '../utils/axiosInstance';

const { Sider } = Layout;
const { Title } = Typography;

function Sidebar({ setActiveKey, activeKey, setNewTabIndex, newTabIndex, tabs, setTabs }) {
  const [treeData, setTreeData] = useState([]);
  const [connectModal, setConnectModal] = useState(false);
  const [siderWidth, setSiderWidth] = useState(400); // valor inicial
  const [isResizing, setIsResizing] = useState(false);

  const fetchTree = async () => {
    const connectionsString = Cookies.get("oracleConnections");
    let connections = [];
    if (connectionsString) {
      try {
        connections = JSON.parse(connectionsString);
      } catch {
        connections = [];
      }
    }
    const data = await getTree(connections);
    setTreeData(data);
  };

  useEffect(() => {
    const savedWidth = Cookies.get("sidebarWidth");
    if (savedWidth) setSiderWidth(parseInt(savedWidth));
    fetchTree();
  }, []);

  useEffect(() => {
    Cookies.set("sidebarWidth", siderWidth);
  }, [siderWidth]);

  useEffect(() => {
    //Cookies.remove('oracleConnections');
    const handleMouseMove = (e) => {
      if (isResizing) {
        const newWidth = Math.min(Math.max(e.clientX, 250), 600); // entre 250 y 600 px
        setSiderWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleConnect = async (values) => {
    try {
      const response = await axiosInstance.post("/test", values);
      if (response.data.success) {
        let connections = Cookies.get("oracleConnections");
        if (typeof connections === "string") {
          try {
            connections = JSON.parse(connections);
          } catch {
            connections = [];
          }
        } else {
          connections = [];
        }
        const newConn = {
          user: values.user,
          host: values.host,
          password: values.password,
          service: values.service,
        };
        const exists = connections.some(
          (c) =>
            c.user === newConn.user &&
            c.host === newConn.host &&
            c.service === newConn.service
        );

        if (!exists) {
          connections.push(newConn);
          console.log(connections);
          Cookies.set("oracleConnections", JSON.stringify(connections), { sameSite: "Lax" });
        }

        await fetchTree();
        return true;
      }
    } catch (err) {
      console.error("Error al conectar", err);
      return false;
    }
  };

  const addTableTab = (title = `${newTabIndex}`) => {
    const newKey = String(newTabIndex);
    setActiveKey(newKey);
    setNewTabIndex((idx) => idx + 1);
  };

  const onSelect = async (selectedKey) => {
    if (selectedKey.includes('_table_') || selectedKey.includes('_view_')) {
      const [host, user, owner, , table] = selectedKey.split('_');
      const conn = JSON.parse(Cookies.get("oracleConnections")).find(c => c.host === host && c.user === user);
      let content = `Tabla: ${table}`;
      let meta = 'Col 1';
      try {
        const res = await axiosInstance.get(`/table/${owner}/${table}`, {
          params: {
            user: conn.user,
            password: conn.password,
            host: conn.host,
            service: conn.service,
          }
        });
        content = (res.data || []);
        meta = (res.data.metaData || []);
      } catch (e) {
        content = "Error cargando datos de tabla";
      }
      setTabs(prev => [...prev, { id: String(newTabIndex), title: table, type: 'table', content, meta }]);
      addTableTab(table);
    }
  };

  return (
    <div>
      <Sider
        width={siderWidth}
        className="bg-white border-r border-gray-300 shadow-md p-4 overflow-y-auto relative"
        style={{ height: '100vh' }}
      >
        <Title level={5} className="text-gray-700 mb-4">Conexiones</Title>
        <Button
          className='mt-2 bg-red-800 text-white border-red-800 hover:!border-red-400 hover:!text-red-400'
          icon={<PlusCircleOutlined />}
          onClick={() => setConnectModal(true)}
        >
          Nueva Conexión
        </Button>
        <Divider className='border-gray-300 w-full'/>
        <Tree
          showIcon
          defaultExpandAll
          treeData={treeData}
          onSelect={(key) => onSelect(key[0])}
          className="custom-tree"
        />

        <div
          className="absolute top-0 right-0 w-2 h-full cursor-col-resize z-50"
          onMouseDown={() => setIsResizing(true)}
        />
      </Sider>

      <ConnectionModal
        open={connectModal}
        onClose={() => setConnectModal(false)}
        onConnect={handleConnect}
      />
    </div>
  );
}

export default Sidebar;
