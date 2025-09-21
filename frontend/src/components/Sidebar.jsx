import { Button, Layout, Tree, Typography, Divider,message} from 'antd';
import Cookies from "js-cookie";
import {
  PlusCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { getTree } from '../api/getTree';
import { useEffect, useState } from 'react';
import ConnectionModal from '../modal/Connection';
import DropTable from '../modal/DropTable';
import DropView from '../modal/DropView';
import CreateTable from '../modal/CreateTable';
import CreateView from '../modal/CreateView';
import axiosInstance from '../utils/axiosInstance';
import MigrateSchema from "../modal/MigrateSchema";

const { Sider } = Layout;
const { Title } = Typography;

function Sidebar({ setActiveKey, activeKey, setNewTabIndex, newTabIndex, tabs, setTabs,owner,setOwner,connection,setConnection}) {
  const [treeData, setTreeData] = useState([]);
  const [connectModal, setConnectModal] = useState(false);
  const [createModal,setCreateModal] = useState(false);
  const [createView, setCreateView] = useState(false);
  const [migrationView,setMigrationView] = useState(false);
  const [dropView,setDropView] = useState(false);
  const [dropModal, setDropModal] = useState(false);
  const [siderWidth, setSiderWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);

  const selectAddTable= (connection,owner)=>{
    setConnection(connection);
    setOwner(owner);
    setCreateModal(true);
  }

  const selectAddView=(connection,owner)=>{
    setConnection(connection);
    setOwner(owner);
    setCreateView(true);
  }

  const openMigration=(connection,owner)=>{
    setConnection(connection);
    setOwner(owner);
    setMigrationView(true);
  }

  const openDiagram = (conn, owner) => {
    setConnection(conn);
    setOwner(owner);
    const title = `Esquema - ${owner}`;
    const type = "diagram";
    setTabs(prev => {
        if (prev.some(tab => tab.title === title && tab.type === type)) {
          return prev;
        }
        return [...prev, { 
          id: String(newTabIndex), 
          title, 
          type, 
          content: { conn, owner }, 
        }];
      });
    setActiveKey(String(newTabIndex));
    setNewTabIndex(idx => idx + 1);
  };

  const selectDeleteTable=(connection,owner)=>{
    setConnection(connection);
    setOwner(owner);
    setDropModal(true);
  }
  const selectDeleteView=(connection,owner)=>{
    setConnection(connection);
    setOwner(owner);
    setDropView(true);
  }
const handleCreate = async (conn, query) => {
  try {
    const res = await axiosInstance.post('/query', {
      host: conn.host,
      user: conn.user,
      password: conn.password,
      service: conn.service,
      query: query,
    });

    await fetchTree();
  } catch (error) {
    message.error('Error al crear tabla: ' + (error.response?.data?.error || error.message));
  }
};

const handleDeleteTable = async(conn,owner,tableName) =>{
  try {
    const result = await axiosInstance.delete(`/table/${owner}/${tableName}`, {
      params:
      {
        user: conn.user,
        password: conn.password,
        host: conn.host,
        service: conn.service,
      }
    });

    await fetchTree();
  } catch (error) {
    
  }
}

const handleDeleteView = async(conn,owner,viewName) =>{
  try {
    const result = await axiosInstance.delete(`/view/${owner}/${viewName}`, {
      params:
      {
        user: conn.user,
        password: conn.password,
        host: conn.host,
        service: conn.service,
      }
    });

    await fetchTree();
  } catch (error) {
    
  }
}

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
    const data = await getTree(connections,selectAddTable,selectDeleteTable,selectAddView,selectDeleteView,openDiagram,openMigration);
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

  const openBody = async(node,selectedKeys)=>{
    const key = node.key;
    try {
      const parts = key.split("_");
      const host = parts[0];
      const user = parts[1];
      const owner = parts[2];
      const type = parts[3].replace(/s$/, "");
      const name = parts.slice(4).join("_");
      const conn = JSON.parse(Cookies.get("oracleConnections") || "[]")
        .find(c => c.host === host && c.user === user);

      if (!conn) {
        console.error("Conexión no encontrada:", host, user);
        return;
      }

      const res = await axiosInstance.get(`/body/${owner}/${name}`, {
        params: {
          user: conn.user,
          password: conn.password,
          host: conn.host,
          service: conn.service,
        }
      });

      setTabs(prev => {
        if (prev.some(tab => tab.title === name && tab.type === type)) {
          return prev;
        }
        return [...prev, { 
          id: String(newTabIndex), 
          title: name, 
          type, 
          content: res.data?.rows[0][0] || 'NULL', 
          meta: res.data?.metaData || [] 
        }];
      });

      addTableTab(name);
    } catch (error) {
      console.error("Error cargando datos:", error);

      setTabs(prev =>
        prev.map(tab =>
          tab.title === info.node.title
            ? { ...tab, content: "Error cargando datos de tabla", meta: [] }
            : tab
        )
      );
    }
  };

  const openTable= async(node,selectedKeys)=>{
    const key = node.key;

    try {
      const parts = key.split("_");
      const host = parts[0];
      const user = parts[1];
      const owner = parts[2];
      const type = parts[3].replace(/s$/, "");
      const name = parts.slice(4).join("_");
      const conn = JSON.parse(Cookies.get("oracleConnections") || "[]")
        .find(c => c.host === host && c.user === user);

      if (!conn) {
        console.error("Conexión no encontrada:", host, user);
        return;
      }
      const res = await axiosInstance.get(`/table/${owner}/${name}`, {
        params: {
          user: conn.user,
          password: conn.password,
          host: conn.host,
          service: conn.service,
        }
      });
      setTabs(prev => {
        if (prev.some(tab => tab.title === name && tab.type === type)) {
          return prev;
        }
        return [...prev, { 
          id: String(newTabIndex), 
          title: name, 
          type, 
          content: res.data || [], 
          meta: res.data?.metaData || [] 
        }];
      });

      addTableTab(name);
    } catch (error) {
      console.error("Error cargando datos:", error);

      setTabs(prev =>
        prev.map(tab =>
          tab.title === info.node.title
            ? { ...tab, content: "Error cargando datos de tabla", meta: [] }
            : tab
        )
      );
    }
  }

const openDDL = async (node, selectedKeys) => {
  const key = node.key;

  try {
    const parts = key.split("_");
    const host = parts[0];
    const user = parts[1];
    const owner = parts[2];
    const type = parts[3].replace(/s$/, ""); // table | view
    const name = parts.slice(4).join("_");
    const conn = JSON.parse(Cookies.get("oracleConnections") || "[]")
      .find(c => c.host === host && c.user === user);

    if (!conn) {
      console.error("Conexión no encontrada:", host, user);
      return;
    }

    const res = await axiosInstance.get(`/ddl/${owner}/${name}/${type}`, {
      params: {
        user: conn.user,
        password: conn.password,
        host: conn.host,
        service: conn.service,
      },
    });

    const ddl = res.data?.ddl || "DDL no disponible";

    setTabs(prev => {
      if (prev.some(tab => tab.title === name && tab.type === `${type}_ddl`)) {
        return prev;
      }
      return [
        ...prev,
        {
          id: String(newTabIndex + 1),
          title: name + " (DDL)",
          type: `${type}_ddl`,
          content: ddl,
        },
      ];
    });

    addTableTab(name + " (DDL)");
  } catch (error) {
    message.error("Error cargando DDL");
    console.error(error);
  }
};


const onSelect = async (selectedKeys, info) => {
  const node = info.node;

  switch (node.type) {
    case "table":
    case "view":
      await openDDL(node,selectedKeys);
      await openTable(node, selectedKeys);
      break;
    default:
      await openDDL(node, selectedKeys);
  }
};


  return (
    <div className="h-full overflow-y-auto">
      <Sider
        width={siderWidth}
        className="bg-white border-r border-gray-300 shadow-md p-4 overflow-y-auto relative"
        style={{ height: '100vh' }}
      >
        <Title level={5} className="text-gray-700 mb-4">Connections</Title>
        <Button
          className='mt-2 bg-red-800 text-white border-red-800 hover:!border-red-400 hover:!text-red-400'
          icon={<PlusCircleOutlined />}
          onClick={() => setConnectModal(true)}
        >
          New
        </Button>
        <Button
          className='mt-2 ml-2 bg-red-800 text-white border-red-800 hover:!border-red-400 hover:!text-red-400'
          icon={<ReloadOutlined />}
          onClick={async() => await fetchTree()}
        >
          Refresh
        </Button>
        <Divider className='border-gray-300 w-full'/>
        <Tree
          showIcon
          defaultExpandAll
          treeData={treeData}
          onSelect={(key,info) => onSelect(key[0],info)}
          className="custom-tree w-full"
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
      <CreateView
        open={createView}
        connection={connection}
        owner={owner}
        onCreate={handleCreate}
        onCancel={()=> setCreateView(false)}
      />
      <CreateTable
        open={createModal}
        connection={connection}
        owner={owner}
        onCreate={handleCreate}
        onCancel={() => setCreateModal(false)}
      />
      <DropTable
        open={dropModal}
        connection={connection}
        owner={owner}
        onDrop={handleDeleteTable}
        onCancel={()=>setDropModal(false)}
      />
      <DropView
        open={dropView}
        connection={connection}
        owner={owner}
        onDrop={handleDeleteView}
        onCancel={()=>setDropView(false)}
      />
      <MigrateSchema
        owner={owner}
        connection={connection}
        visible={migrationView}
        onClose={()=>{setMigrationView(false)}}
      />
    </div>
  );
}

export default Sidebar;
