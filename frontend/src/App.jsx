import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import TabPanel from './components/TabPanel';

function App() {
  const [tabs, setTabs] = useState([]);
  const [owner,setOwner] = useState(false);
  const [connection,setConnection] = useState(false);
  const [activeKey, setActiveKey] = useState("1");
  const [newTabIndex, setNewTabIndex] = useState(2);
  
  return (
    <>
      <header className="bg-white shadow-md h-16 border-b border-gray-300 flex items-center px-4">
        <img alt="logo" src="/logo.png" className="ml-3 h-10" />
        <text className='text-gray-800 font-serif font-semibold text-lg ml-5'>
          OracleDBAdmin
        </text>
      </header>
      <div className="w-screen flex bg-gray-100">
        <Sidebar 
          setActiveKey={setActiveKey} setTabs={setTabs} setNewTabIndex={setNewTabIndex}
          activeKey={activeKey} tabs={tabs} newTabIndex={newTabIndex} connection={connection} setConnection={setConnection}
          owner={owner} setOwner={setOwner}
        />
        <div className="flex-1 flex flex-col">
          <TabPanel 
            setActiveKey={setActiveKey} setTabs={setTabs} setNewTabIndex={setNewTabIndex}
            activeKey={activeKey} tabs={tabs} newTabIndex={newTabIndex} owner={owner} connection={connection}
          />
        </div>
    </div>
    </>
  );
}

export default App;
