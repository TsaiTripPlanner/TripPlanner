// src/components/ReferenceSection.js
import React, { useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { ICON_SVG } from "../utils/icons";
import { useTheme } from "../utils/theme";
import ReferenceAddForm from "./ReferenceAddForm";
import ReferenceItem from "./ReferenceItem";
import SpotDetailModal from "./SpotDetailModal";

const ReferenceSection = ({ references, onAdd, onUpdate, onDelete, onReorder }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("transport");
  const [viewingDetail, setViewingDetail] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const filteredRefs = useMemo(() => {
    return references.filter(ref => {
      if (activeTab === "transport") return ref.type === "transport";
      if (activeTab === "spot") return ref.type === "spot";
      if (activeTab === "guide") return ref.type === "guide" || ref.type === "link" || !ref.type;
      return false;
    });
  }, [references, activeTab]);

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

      {showAddForm && <ReferenceAddForm activeTab={activeTab} onAdd={(data) => { onAdd(data); setShowAddForm(false); }} theme={theme} />}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="references-list">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className={activeTab === "spot" ? "grid grid-cols-1 sm:grid-cols-2 gap-6" : "space-y-4"}>
              {filteredRefs.map((ref, index) => (
                <Draggable key={ref.id} draggableId={ref.id} index={index}>
                  {(draggableProvided) => (
                    <ReferenceItem
                      refData={ref}
                      theme={theme}
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