import { useState } from "react";
import { Tabs, Button, Input } from "antd";
import EditorView from "./EditorView";
import OutputTable from "./OutputTable";
import DiagramView from "./DiagramView";

const { TabPane } = Tabs;
const { TextArea } = Input;

function TabPanel({setActiveKey, activeKey, setNewTabIndex, newTabIndex, tabs, setTabs, owner, connection}) {
  const onChange = (key) => {
    setActiveKey(key);
  };

  const onEdit = (targetKey, action) => {
    console.log(targetKey,action)
    if (action === "remove") {
      const newTabs = tabs.filter((tab) => tab.id !== targetKey);
      setTabs(newTabs);
      if (targetKey === activeKey && newTabs.length > 0) {
        setActiveKey(newTabs[0].id);
      }
      console.log(tabs);
    }
    else if(action === 'add'){
      addEditorTab();
    }
  };
  const addEditorTab = (title = `Editor ${newTabIndex}`) => {
    const newKey = String(newTabIndex);
    setTabs((prev) => [
      ...prev,
      { id: newKey, title, type: "editor", content: "" },
    ]);
    setActiveKey(newKey);
    setNewTabIndex((idx) => idx + 1);
  };

  const updateContent = (key, value) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === key ? { ...tab, content: value } : tab
      )
    );
  };

  return (
  <div className="flex-1 flex flex-col bg-gray-50 p-4">
    <Tabs
      type="editable-card"
      activeKey={activeKey}
      onChange={onChange}
      onEdit={onEdit}
      className="bg-white shadow rounded custom-red-tabs"
      size="middle"
    >
      {tabs.map((tab) => (
        <TabPane tab={tab.title} key={tab.id} >
          <div className="p-4">
            {tab.type === "table" || tab.type==='view'? (
              <OutputTable meta={tab.meta} data={tab.content || []} />
            ) : (tab.type === "diagram" ? (
              <DiagramView owner={owner} connection={connection} />
            ) : (
              tab.type === "editor" ? (<EditorView/>):(<EditorView isEditable={false} content={tab.content}/>)
            ))
            }
          </div>
        </TabPane>
      ))}
    </Tabs>
  </div>
  );
}

export default TabPanel;
