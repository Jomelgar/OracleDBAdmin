import axiosInstance from "../utils/axiosInstance";
import {
  DatabaseOutlined,
  TableOutlined,
  EyeOutlined,
  FolderOutlined,
  NodeIndexOutlined,
  InfoOutlined,
  AimOutlined,
  BoxPlotOutlined,
  BookOutlined,
  CodeOutlined,
} from '@ant-design/icons';

export async function getTree(connections) {
  try {
    const allConnectionsNodes = [];

    // Itera todas las conexiones
    for (const conn of connections) {
      const res = await axiosInstance.get('/tree', {
        params: {
          user: conn.user,
          password: conn.password,
          host: conn.host,
          service: conn.service,
        },
      });

      const data = res.data;

      // Construye el nodo para esta conexión
      const childrenOwners = data.map((ownerObj) => ({
        title: ownerObj.owner,
        key: `owner_${conn.host}_${conn.user}_${ownerObj.owner}`,
        icon: <FolderOutlined className="text-red-800"/>,
        children: [
          {
            title: 'Tables',
            key: `owner_${conn.host}_${conn.user}_${ownerObj.owner}_tables`,
            icon: <TableOutlined className="text-red-800"/>,
            children: ownerObj.tables.map((tbl) => ({
              title: tbl,
              key: `${conn.host}_${conn.user}_${ownerObj.owner}_table_${tbl}`,
            })),
          },
          {
            title: 'Views',
            key: `owner_${conn.host}_${conn.user}_${ownerObj.owner}_views`,
            icon: <EyeOutlined className="text-red-800"/>,
            children: ownerObj.views.map((vw) => ({
              title: vw,
              key: `${conn.host}_${conn.user}_${ownerObj.owner}_view_${vw}`,
            })),
          },
          {
            title: 'Indexes',
            key: `owner_${conn.host}_${conn.user}_${ownerObj.owner}_indexes`,
            icon: <InfoOutlined className="text-red-800"/>,
            children: ownerObj.indexes.map((index)=>({
              title: index,
              key: `${conn.host}_${conn.user}_${ownerObj.owner}_index_${index}`,
            }))
          },
          {
            title: 'Triggers',
            key:`owner_${conn.host}_${conn.user}_${ownerObj.owner}_triggers`,
            icon:<AimOutlined className="text-red-800"/>,
          },
          {
            title: 'Packages',
            key:`owner_${conn.host}_${conn.user}_${ownerObj.owner}_packages`,
            icon: <BookOutlined className="text-red-800"/>,
          },
          {
            title: 'Procedures',
            key:`owner_${conn.host}_${conn.user}_${ownerObj.owner}_procedures`,
            icon: <CodeOutlined className="text-red-800"/>
          },
          {
            title: 'Functions',
            key:`owner_${conn.host}_${conn.user}_${ownerObj.owner}_functions`,
            icon: <CodeOutlined className="text-red-800"/>
          }
        ],
      }));

      allConnectionsNodes.push({
        title: `${conn.service} - ${conn.user}`,
        key: `conn_${conn.service}_${conn.user}`,
        icon: <DatabaseOutlined className="text-red-800" />,
        children: childrenOwners,
      });
    }

    return allConnectionsNodes;
  } catch (err) {
    console.error("Error al obtener el árbol:", err);
    return [];
  }
}
