import axiosInstance from "../utils/axiosInstance";
import {Dropdown,Button} from 'antd';
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
  MoreOutlined,
  CodeOutlined,
} from '@ant-design/icons';

export async function getTree(connections, setCreateModal,setDropTable) {
  try {
    const allConnectionsNodes = [];

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

      const childrenOwners = data.map((ownerObj) => ({
        title: ownerObj.owner,
        key: `owner_${conn.host}_${conn.user}_${ownerObj.owner}`,
        icon: <FolderOutlined className="text-red-800" />,
        children: [
          {
            title: (
              <span className="flex justify-between w-full items-center">
                Tables
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'create_table',
                        label: 'Crear tabla',
                        onClick: () => setCreateModal(conn, ownerObj.owner),
                      },
                      {
                        key: 'drop_table',
                        label: 'Eliminar tabla',
                        onClick: () => setDropTable(true),
                      },
                    ],
                  }}
                  trigger={['click']}
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<MoreOutlined />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Dropdown>
              </span>
            ),
            key: `owner_${conn.host}_${conn.user}_${ownerObj.owner}_tables`,
            icon: <TableOutlined className="text-red-800" />,
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
            children: ownerObj.triggers.map((trigger)=>({
              title: trigger,
              key: `${conn.host}_${conn.user}_${ownerObj.owner}_trigger_${trigger}`,
            }))
          },
          {
            title: 'Packages',
            key:`owner_${conn.host}_${conn.user}_${ownerObj.owner}_packages`,
            icon: <BookOutlined className="text-red-800"/>,
            children: ownerObj.packages.map((pack)=>({
              title: pack,
              key: `${conn.host}_${conn.user}_${ownerObj.owner}_package_${pack}`,
            }))
          },
          {
            title: 'Procedures',
            key:`owner_${conn.host}_${conn.user}_${ownerObj.owner}_procedures`,
            icon: <CodeOutlined className="text-red-800"/>,
            children: ownerObj.procedures.map((p)=>({
              title: p,
              key: `${conn.host}_${conn.user}_${ownerObj.owner}_procedure_${p}`,
            }))
          },
          {
            title: 'Functions',
            key:`owner_${conn.host}_${conn.user}_${ownerObj.owner}_functions`,
            icon: <CodeOutlined className="text-red-800"/>,
            children: ownerObj.functions.map((p)=>({
              title: p,
              key: `${conn.host}_${conn.user}_${ownerObj.owner}_package_${p}`,
            }))
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
