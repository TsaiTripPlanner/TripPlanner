// src/components/ReferenceSection.js
import React, { useState, useMemo, forwardRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { ICON_SVG } from "../utils/icons";
import { useTheme } from "../utils/theme";
import ReferenceAddForm from "./ReferenceAddForm";
import ReferenceItem from "./ReferenceItem";
import SpotDetailModal from "./SpotDetailModal";

const ReferenceSection = ({ references, onAdd, onUpdate, onDelete, onReorder, totalDays }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("transport");
  const [viewingDetail, setViewingDetail] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // 交通工具專用的天數過濾狀態
  const [transportDayFilter, setTransportDayFilter] = useState(1);
  
  const filteredRefs = useMemo(() => {
    return references.filter(ref => {
      // 類別過濾
      let typeMatch = false;
      if (activeTab === "transport") typeMatch = ref.type === "transport";
      else if (activeTab === "spot") typeMatch = ref.type === "spot";
      else if (activeTab === "guide") typeMatch = ref.type === "guide" || ref.type === "link" || !ref.type;
      
      if (!typeMatch) return false;

      // 如果是交通工具，增加天數過濾
      if (activeTab === "transport" && transportDayFilter !== 0) {
        return ref.day === transportDayFilter;
      }
      
      return true;
    });
  }, [references, activeTab, transportDayFilter]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const currentTabItems = Array.from(filteredRefs);
    const [reorderedItem] = currentTabItems.splice(result.source.index, 1);
    currentTabItems.splice(result.destination.index, 0, reorderedItem);
    const otherTabItems = references.filter(ref => !filteredRefs.some(v => v.id === ref.id));
    onReorder([...currentTabItems, ...otherTabItems]);
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
       {/* 標題與新增按鈕 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-xl font-bold flex items-center ${theme.accentText}`}>
          <ICON_SVG.paperClip className="w-6 h-6 mr-2" /> 旅遊參考庫
        </h2>
        <button onClick={() => setShowAddForm(!showAddForm)} className={`p-2 rounded-full text-white ${theme.buttonPrimary}`}>
          {showAddForm ? <ICON_SVG.xMark className="w-6 h-6" /> : <ICON_SVG.plusSmall className="w-6 h-6" />}
        </button>
      </div>

      {/* --- 子分頁切換：修正手機版換行問題 --- */}
      <div className="flex flex-nowrap space-x-1 mb-6 border-b border-gray-100 overflow-x-auto scrollbar-hide">
        {[
          { id: "transport", name: "交通指引", icon: "transport" },
          { id: "spot", name: "景點介紹", icon: "camera" },
          { id: "guide", name: "攻略收藏", icon: "link" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setShowAddForm(false); }}
            className={`flex items-center shrink-0 px-4 py-2 text-sm font-bold transition whitespace-nowrap ${
              activeTab === tab.id
                ? `${theme.accentText} border-b-2 ${theme.accentBorder}`
                : "text-gray-400"
            }`}
          >
            {(() => { const Icon = ICON_SVG[tab.icon]; return <Icon className="w-4 h-4 mr-1.5" />; })()}
            {tab.name}
          </button>
        ))}
      </div>

      {/* 交通分頁專用的天數切換列 */}
      {activeTab === "transport" && (
        <div className="flex flex-nowrap space-x-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => (
            <button
              key={d}
              onClick={() => setTransportDayFilter(d)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                transportDayFilter === d ? theme.buttonPrimary + " text-white" : "bg-gray-100 text-gray-400"
              }`}
            >
              Day {d}
            </button>
          ))}
        </div>
      )}

      {showAddForm && (
        <ReferenceAddForm 
          activeTab={activeTab} 
          totalDays={totalDays} // 傳入天數
          onAdd={(data) => { onAdd(data); setShowAddForm(false); }} 
          theme={theme} 
        />
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="references-list">
          {(provided) => (
            <div {...provided.droppableProps} 
              ref={provided.innerRef} 
              className="space-y-6" 
            >
              {filteredRefs.map((ref, index) => (
                <Draggable key={ref.id} draggableId={ref.id} index={index}>
                  {(draggableProvided) => (
                    <ReferenceItem
                      refData={ref}
                      theme={theme}
                      totalDays={totalDays}
                      onDelete={onDelete}
                      onUpdate={onUpdate}
                      onView={setViewingDetail}
                      dragHandleProps={draggableProvided.dragHandleProps}
                      {...draggableProvided.draggableProps}
                      ref={draggableProvided.innerRef}
                    />
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <SpotDetailModal viewingDetail={viewingDetail} onClose={() => setViewingDetail(null)} theme={theme} />
    </div>
  );
};

export default ReferenceSection;