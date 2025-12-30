// src/components/ReferenceSection.js
import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { ICON_SVG } from "../utils/icons";
import { useTheme } from "../utils/theme";
import ImageUpload from "./ImageUpload";

const ReferenceSection = ({ references, onAdd, onUpdate, onDelete, onReorder }) => {
  const { theme } = useTheme();
  
  const [activeTab, setActiveTab] = useState("transport"); // 預設為交通
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set());

  const [newData, setNewData] = useState({
    title: "",
    url: "",
    imageUrl: "",
    description: "",
  });
  const [isFetching, setIsFetching] = useState(false);

  // 過濾出當前分頁的資料
  const filteredRefs = references.filter(
    (ref) => (ref.type || "transport") === activeTab
  );

  const toggleExpand = (id) => {
    const newIds = new Set(expandedIds);
    if (newIds.has(id)) newIds.delete(id);
    else newIds.add(id);
    setExpandedIds(newIds);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    // 取得當前 Tab 的排序
    const currentTabItems = Array.from(filteredRefs);
    const [reorderedItem] = currentTabItems.splice(result.source.index, 1);
    currentTabItems.splice(result.destination.index, 0, reorderedItem);

    // 將更新後的當前 Tab 項目與其他 Tab 的項目合併，保持全局順序
    const otherTabItems = references.filter(ref => (ref.type || "transport") !== activeTab);
    onReorder([...currentTabItems, ...otherTabItems]);
  };

  const fetchMetadata = async (targetUrl) => {
    if (!targetUrl.trim()) return;
    setIsFetching(true);
    try {
      const response = await fetch(
        `https://api.microlink.io?url=${encodeURIComponent(targetUrl)}`
      );
      const result = await response.json();
      if (result.status === "success") {
        const { data } = result;
        const update = {
          title: data.title || "",
          imageUrl: data.image?.url || data.logo?.url || "",
          description: data.description || "",
        };
        if (editingId) setEditData((prev) => ({ ...prev, ...update }));
        else setNewData((prev) => ({ ...prev, ...update }));
      }
    } catch (error) {
      console.error("抓取失敗", error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async (id) => {
    await onUpdate(id, editData);
    setEditingId(null);
  };

  const handleAddNew = async () => {
    if (!newData.title.trim()) return alert("請輸入標題");
    await onAdd({ ...newData, type: activeTab });
    setNewData({ title: "", url: "", imageUrl: "", description: "" });
    setShowAddForm(false);
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-xl font-bold flex items-center ${theme.accentText}`}>
          <ICON_SVG.paperClip className="w-6 h-6 mr-2" /> 旅遊參考庫
        </h2>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingId(null);
          }}
          className={`p-2 rounded-full text-white shadow-md ${theme.buttonPrimary}`}
        >
          {showAddForm ? <ICON_SVG.xMark className="w-6 h-6" /> : <ICON_SVG.plusSmall className="w-6 h-6" />}
        </button>
      </div>

      {/* --- 子分頁切換 --- */}
      <div className="flex space-x-1 mb-6 border-b border-gray-100 overflow-x-auto scrollbar-hide">
        {[
          { id: "transport", name: "交通指引", icon: "transport" },
          { id: "spot", name: "景點介紹", icon: "camera" },
          { id: "guide", name: "攻略收藏", icon: "link" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setEditingId(null); setShowAddForm(false); }}
            className={`flex items-center px-4 py-2 text-sm font-bold transition whitespace-nowrap ${
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

      {/* --- 新增表單 --- */}
      {showAddForm && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 space-y-4 animate-fade-in">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={activeTab === "transport" ? "貼上時刻表或路線網址 (選填)..." : "貼上網址 (選填)..."}
              value={newData.url}
              onChange={(e) => setNewData({ ...newData, url: e.target.value })}
              className="flex-1 px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-slate-400"
            />
            <button 
              onClick={() => fetchMetadata(newData.url)} 
              disabled={isFetching}
              className="shrink-0 px-3 py-2 bg-white border rounded text-xs font-bold shadow-sm active:scale-95 disabled:opacity-50"
            >
              {isFetching ? "..." : "抓取"}
            </button>
          </div>
          <input
            type="text"
            placeholder={activeTab === "transport" ? "起點 -> 終點標題 *" : "標題 *"}
            value={newData.title}
            onChange={(e) => setNewData({ ...newData, title: e.target.value })}
            className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-slate-400"
          />
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 ml-1">
              {activeTab === "transport" ? "路線地圖 / 轉乘截圖 (建議)" : "照片 (選填)"}
            </label>
            <ImageUpload currentImage={newData.imageUrl} onUploadSuccess={(url) => setNewData({ ...newData, imageUrl: url })} />
          </div>
          <textarea
            placeholder={activeTab === "transport" ? "詳細路線指引，如：北口出來左轉，看到超商後..." : "詳細描述..."}
            value={newData.description}
            onChange={(e) => setNewData({ ...newData, description: e.target.value })}
            rows="3"
            className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-slate-400"
          />
          <button onClick={handleAddNew} className={`w-full py-2 rounded-md text-white font-bold shadow-md ${theme.buttonPrimary}`}>
            確認新增到{activeTab === "transport" ? "交通" : activeTab === "spot" ? "景點" : "攻略"}
          </button>
        </div>
      )}

      {/* --- 列表區：支援拖拽排序 --- */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="references-list">
          {(provided) => (
            <div 
              {...provided.droppableProps} 
              ref={provided.innerRef}
              className={activeTab === "spot" ? "grid grid-cols-1 sm:grid-cols-2 gap-6" : "space-y-4"}
            >
              {filteredRefs.map((ref, index) => (
                <Draggable key={ref.id} draggableId={ref.id} index={index}>
                  {(draggableProvided, snapshot) => (
                    <div
                      ref={draggableProvided.innerRef}
                      {...draggableProvided.draggableProps}
                      className={`relative bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition group ${
                        snapshot.isDragging ? "shadow-2xl ring-2 ring-slate-200 z-50" : ""
                      }`}
                    >
                      {/* 拖拽手把 */}
                      <div 
                        {...draggableProvided.dragHandleProps} 
                        className="absolute left-1 top-1/2 -translate-y-1/2 p-2 text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-grab active:cursor-grabbing"
                      >
                        <ICON_SVG.menu className="w-5 h-5" />
                      </div>

                      {editingId === ref.id ? (
                        /* === 編輯模式 === */
                        <div className="p-4 space-y-3 bg-slate-50">
                          <input type="text" value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} className="w-full px-3 py-2 border rounded text-sm" />
                          <ImageUpload currentImage={editData.imageUrl} onUploadSuccess={(url) => setEditData({ ...editData, imageUrl: url })} />
                          <textarea value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} rows="4" className="w-full px-3 py-2 border rounded text-sm" />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-gray-200 rounded text-xs">取消</button>
                            <button onClick={() => handleSave(ref.id)} className={`px-3 py-1 text-white rounded text-xs ${theme.buttonPrimary}`}>儲存</button>
                          </div>
                        </div>
                      ) : activeTab === "transport" ? (
                        /* === 交通佈局：強化路線圖顯示 === */
                        <div className="flex flex-col pl-10 pr-4 py-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg text-slate-700 leading-tight">{ref.title}</h3>
                            <div className="flex gap-2">
                              <button onClick={() => { setEditingId(ref.id); setEditData(ref); }} className="text-gray-300 hover:text-slate-500 transition"><ICON_SVG.pencil className="w-4 h-4" /></button>
                              <button onClick={() => onDelete(ref.id)} className="text-gray-300 hover:text-red-400 transition"><ICON_SVG.trash className="w-4 h-4" /></button>
                            </div>
                          </div>
                          
                          {ref.imageUrl && (
                            <div className="mb-3 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                              <img 
                                src={ref.imageUrl} 
                                alt="路線地圖" 
                                className="w-full h-auto max-h-[400px] object-contain mx-auto" 
                                onClick={() => window.open(ref.imageUrl)} 
                              />
                            </div>
                          )}

                          {ref.description && (
                            <div className="text-sm text-gray-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3 leading-relaxed">
                              {ref.description}
                            </div>
                          )}

                          {ref.url && (
                            <a 
                              href={ref.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="flex items-center justify-center w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition shadow-sm"
                            >
                              <ICON_SVG.link className="w-4 h-4 mr-2" /> 前往外部路線連結 / 時刻表
                            </a>
                          )}
                        </div>
                      ) : activeTab === "spot" ? (
                        /* === 景點佈局 (網格) === */
                        <div className="flex flex-col h-full pl-2">
                          <div className="aspect-video w-full overflow-hidden bg-gray-100">
                            {ref.imageUrl && (
                              <img src={ref.imageUrl} alt="" className="w-full h-full object-cover" onClick={() => window.open(ref.imageUrl)} />
                            )}
                          </div>
                          <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-lg leading-tight pr-2">{ref.title}</h3>
                              <div className="flex gap-2 shrink-0">
                                <button onClick={() => { setEditingId(ref.id); setEditData(ref); }} className="text-gray-300 hover:text-slate-500"><ICON_SVG.pencil className="w-4 h-4" /></button>
                                <button onClick={() => onDelete(ref.id)} className="text-gray-300 hover:text-red-400"><ICON_SVG.trash className="w-4 h-4" /></button>
                              </div>
                            </div>
                            <div 
                              onClick={() => toggleExpand(ref.id)}
                              className={`text-sm text-gray-500 cursor-pointer whitespace-pre-wrap ${expandedIds.has(ref.id) ? "" : "line-clamp-3"}`}
                            >
                              {ref.description || "暫無內容..."}
                            </div>
                            {ref.description && ref.description.length > 60 && (
                              <button onClick={() => toggleExpand(ref.id)} className="text-[10px] text-blue-500 mt-1 font-bold">
                                {expandedIds.has(ref.id) ? "收合內容 ▲" : "展開全文 ▼"}
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* === 攻略佈局 (書籤式) === */
                        <div className="flex p-3 gap-3 pl-10">
                          {ref.imageUrl && (
                            <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-gray-100">
                              <img src={ref.imageUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-grow min-w-0 flex flex-col justify-center">
                            <div className="flex justify-between items-start">
                              <h3 className="font-bold text-base truncate pr-2">{ref.title}</h3>
                              <div className="flex gap-2 shrink-0">
                                <button onClick={() => { setEditingId(ref.id); setEditData(ref); }} className="text-gray-300"><ICON_SVG.pencil className="w-3.5 h-3.5" /></button>
                                <button onClick={() => onDelete(ref.id)} className="text-gray-300"><ICON_SVG.trash className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                            <p className="text-xs text-gray-400 line-clamp-2 mt-1">{ref.description}</p>
                            {ref.url && (
                              <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 mt-1 flex items-center hover:underline font-bold">
                                <ICON_SVG.link className="w-3 h-3 mr-1" /> 開啟攻略連結
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {filteredRefs.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-xl mt-4">
          <ICON_SVG.paperClip className="w-10 h-10 text-gray-200 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">此分類目前沒有資料</p>
          <button onClick={() => setShowAddForm(true)} className="text-blue-400 text-xs font-bold mt-2 hover:underline">
            點此新增第一筆
          </button>
        </div>
      )}
    </div>
  );
};

export default ReferenceSection;