// src/components/ReferenceSection.js
import React, { useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { ICON_SVG } from "../utils/icons";
import { useTheme } from "../utils/theme";
import ImageUpload from "./ImageUpload";
import Modal from "./Modal";
import SmartText from "./SmartText";

// --- 分頁定義與解析工具 ---
const SPOT_SUB_TABS = [
  { id: 'info', name: '介紹', icon: 'info' },
  { id: 'food', name: '美食', icon: 'food' },
  { id: 'shop', name: '特色店家', icon: 'shopping' },
  { id: 'nearby', name: '附近景點', icon: 'mapPin' },
  { id: 'note', name: '注意事項', icon: 'noteText' },
];

const parseSpotContent = (text) => {
  const sections = { info: '', food: '', shop: '', nearby: '', note: '' };
  if (!text || typeof text !== 'string') return sections;
  
  const parts = text.split(/\[(美食|特色店家|附近景點|注意事項)\]/);
  sections.info = (parts[0] || '').trim();
  
  for (let i = 1; i < parts.length; i += 2) {
    const key = parts[i];
    const content = (parts[i + 1] || '').trim();
    if (key === '美食') sections.food = content;
    else if (key === '特色店家') sections.shop = content;
    else if (key === '附近景點') sections.nearby = content;
    else if (key === '注意事項') sections.note = content;
  }
  return sections;
};

// 將分開的各段內容組合成帶標籤的字串
const assembleSpotContent = (sections) => {
  let result = (sections.info || '').trim();
  if (sections.food?.trim()) result += `\n\n[美食]\n${sections.food.trim()}`;
  if (sections.shop?.trim()) result += `\n\n[特色店家]\n${sections.shop.trim()}`;
  if (sections.nearby?.trim()) result += `\n\n[附近景點]\n${sections.nearby.trim()}`;
  if (sections.note?.trim()) result += `\n\n[注意事項]\n${sections.note.trim()}`;
  return result;
};

const ReferenceSection = ({ references, onAdd, onUpdate, onDelete, onReorder }) => {
  const { theme } = useTheme();
  
  const [activeTab, setActiveTab] = useState("transport"); // 預設為交通
  const [viewingDetail, setViewingDetail] = useState(null);
  const [activeSpotTab, setActiveSpotTab] = useState('info');
  const [editingId, setEditingId] = useState(null);
  const [editSections, setEditSections] = useState({ info: '', food: '', shop: '', nearby: '', note: '' });
  const [activeEditTab, setActiveEditTab] = useState('info'); // 記錄編輯時停在哪個分頁
  const [newSections, setNewSections] = useState({ info: '', food: '', shop: '', nearby: '', note: '' });
  const [activeAddSubTab, setActiveAddSubTab] = useState('info');
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

  const spotSections = useMemo(() => {
    if (!viewingDetail) return null;
    return parseSpotContent(viewingDetail.description || "");
  }, [viewingDetail]);

  // 過濾出當前分頁的資料
  const filteredRefs = references.filter((ref) => {
    // 如果資料完全沒有 type，舊景點通常沒 type 或 type 是 spot
    // 舊攻略 type 是 link
    const itemType = ref.type;
    
    if (activeTab === "transport") {
      return itemType === "transport";
    }
    if (activeTab === "spot") {
      // 如果 type 是 spot，或者是舊資料（可能沒 type），我們讓它出現在景點
      return itemType === "spot";
    }
    if (activeTab === "guide") {
      // 攻略分頁：顯示 guide、link 或是完全沒設定 type 的資料
      return itemType === "guide" || itemType === "link" || !itemType;
    }
    return false;
  });

  const toggleExpand = (id) => {
    const newIds = new Set(expandedIds);
    if (newIds.has(id)) newIds.delete(id);
    else newIds.add(id);
    setExpandedIds(newIds);
  };

  const handleDragEnd = (result) => {
     if (!result.destination) return;

     // 1. 取得當前畫面上看到的項目
     const currentTabItems = Array.from(filteredRefs);
     const [reorderedItem] = currentTabItems.splice(result.source.index, 1);
     currentTabItems.splice(result.destination.index, 0, reorderedItem);

     // 2. 找出「不屬於」當前分頁的所有其他項目（避免把它們刪掉）
     // 透過 ID 排除掉目前正在顯示的這些項目即可
     const otherTabItems = references.filter(
       (ref) => !filteredRefs.some((visibleItem) => visibleItem.id === ref.id)
     );

     // 3. 合併回傳，交給 hook 更新資料庫順序
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

  const handleSave = async (id, updatedData) => {
  // 如果有傳入新資料就用新資料，沒有就用狀態裡的 editData
  const dataToSave = updatedData || editData;
  await onUpdate(id, dataToSave);
  setEditingId(null);
  };

  const handleAddNew = async () => {
    if (!newData.title.trim()) return alert("請輸入標題");
     // 判斷：如果是景點才需要組裝，否則直接用 newData.description
    const finalDesc = activeTab === 'spot' 
     ? assembleSpotContent(newSections) 
     : newData.description;

  await onAdd({ ...newData, description: finalDesc, type: activeTab });
  
  // 重置所有輸入狀態
  setNewData({ title: "", url: "", imageUrl: "", description: "" });
  setNewSections({ info: '', food: '', shop: '', nearby: '', note: '' });
  setActiveAddSubTab('info');
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
          <div className="flex gap-2 items-center"> {/* 確保垂直置中 */}
            <input
              type="text"
              placeholder={activeTab === "transport" ? "貼上時刻表或路線網址 (選填)..." : "貼上網址 (選填)..."}
              value={newData.url}
              onChange={(e) => setNewData({ ...newData, url: e.target.value })}
              // 加入 min-w-0 確保它在窄螢幕下可以縮得比預設寬度小
              className={`flex-1 min-w-0 px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 ${theme.ringFocus} ${theme.borderFocus}`}
            />
            <button 
              onClick={() => fetchMetadata(newData.url)} 
              disabled={isFetching}
              // 確保按鈕不縮減，並縮小手機版的左右內距 (px-2)
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
          {/* --- 判斷類型顯示不同的「新增」輸入框 --- */}
{activeTab === 'spot' ? (
  /* 景點模式：顯示分頁標籤 + 大格子 */
  <div className="mt-4">
    <div className="flex space-x-1 overflow-x-auto pb-1 scrollbar-hide">
      {SPOT_SUB_TABS.map(tab => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setActiveAddSubTab(tab.id)}
          className={`px-3 py-1.5 rounded-t-lg text-[11px] font-bold transition-all ${
            activeAddSubTab === tab.id 
              ? 'bg-white border-t border-l border-r border-gray-300 text-slate-700' 
              : 'text-gray-400 hover:text-slate-500'
          }`}
        >
          {tab.name}
        </button>
      ))}
    </div>
    <div className="bg-white p-2 border border-gray-300 rounded-b-lg shadow-inner">
      <textarea 
        value={newSections[activeAddSubTab] || ''} 
        onChange={(e) => setNewSections({ ...newSections, [activeAddSubTab]: e.target.value })} 
        rows="10" 
        className="w-full px-3 py-2 border-none text-sm focus:ring-0 outline-none leading-relaxed"
        placeholder={`請輸入「${SPOT_SUB_TABS.find(t => t.id === activeAddSubTab).name}」的詳細內容...`}
      />
    </div>
    <p className="text-[10px] text-gray-400 mt-2 ml-1 italic">※ 景點模式下，系統會自動按分頁儲存內容</p>
  </div>
) : (
  /* 交通或攻略模式：顯示單一大型格子 */
  <div className="space-y-1">
    <label className="text-[10px] font-bold text-gray-400 ml-1">詳細內容 (支援換行)</label>
    <textarea
      placeholder={activeTab === "transport" ? "輸入路線、轉乘方式或時刻表說明..." : "貼上攻略心得或重要資訊..."}
      value={newData.description}
      onChange={(e) => setNewData({ ...newData, description: e.target.value })}
      rows="10" 
      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-slate-400 leading-relaxed shadow-inner"
    />
  </div>
)}
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
  /* === 分頁編輯模式 === */
  <div className="p-4 space-y-4 bg-slate-50 border-2 border-slate-300 rounded-xl animate-fade-in">
    {/* 標題與操作按鈕 */}
    <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-2">
      <span className="text-sm font-bold text-slate-700 italic">模式：詳細編輯</span>
      <div className="flex gap-2">
        <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs font-bold transition">取消</button>
        <button 
          onClick={() => {
            // 只有景點需要組裝，交通/攻略直接存 editData.description
            const finalDesc = ref.type === 'spot' 
              ? assembleSpotContent(editSections) 
              : editData.description;
            handleSave(ref.id, { ...editData, description: finalDesc });
          }} 
          className={`px-3 py-1 text-white rounded text-xs font-bold shadow-sm ${theme.buttonPrimary}`}
        >
          儲存
        </button>
      </div>
    </div>

    {/* 名稱與圖片區 */}
    <div className="space-y-3">
      <label className="block text-[10px] font-bold text-gray-400 ml-1">地點名稱</label>
      <input 
        type="text" 
        value={editData.title} 
        onChange={(e) => setEditData({ ...editData, title: e.target.value })} 
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-bold focus:ring-2 focus:ring-slate-200 outline-none" 
      />
      
      <label className="block text-[10px] font-bold text-gray-400 ml-1">封面圖片</label>
      <ImageUpload currentImage={editData.imageUrl} onUploadSuccess={(url) => setEditData({ ...editData, imageUrl: url })} />
    </div>

    {/* 內容區：判斷類型 */}
    {ref.type === 'spot' ? (
      /* 景點：顯示分頁編輯器 */
    <div className="mt-4">
      <div className="flex space-x-1 overflow-x-auto pb-1 scrollbar-hide">
        {SPOT_SUB_TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveEditTab(tab.id)}
            className={`px-3 py-2 rounded-t-lg text-[11px] font-bold transition-all ${
              activeEditTab === tab.id 
                ? 'bg-white border-t border-l border-r border-gray-300 text-slate-700' 
                : 'text-gray-400 hover:text-slate-500'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>
      
      {/* 編輯輸入區：這裡把 Rows 加大到 10，編輯更舒服 */}
      <div className="bg-white p-3 border border-gray-300 rounded-b-lg rounded-tr-lg shadow-inner">
        <textarea 
          value={editSections[activeEditTab] || ''} 
          onChange={(e) => setEditSections({ ...editSections, [activeEditTab]: e.target.value })} 
          rows="10" 
          className="w-full px-3 py-2 border-none text-sm focus:ring-0 outline-none leading-relaxed text-slate-600"
          placeholder={`請在此輸入「${SPOT_SUB_TABS.find(t => t.id === activeEditTab).name}」的詳細內容...`}
        />
      </div>
    </div>
    ) : (
      /* 交通與攻略：顯示單一大型欄位 */
      <div className="mt-2">
        <label className="text-[10px] font-bold text-gray-400 ml-1">詳細內容</label>
        <textarea
          value={editData.description}
          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
          rows="10"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm leading-relaxed shadow-inner outline-none focus:ring-1 focus:ring-slate-300"
        />
      </div>
    )}
  </div>
) : activeTab === "transport" ? (
                        /* === 交通佈局：強化路線圖顯示 === */
                        <div className="flex flex-col pl-10 pr-4 py-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg text-slate-700 leading-tight">{ref.title}</h3>
                            <div className="flex gap-2">
                              <button onClick={() => { 
                                setEditingId(ref.id); 
                                setEditData(ref); 
                                setEditSections(parseSpotContent(ref.description)); 
                                setActiveEditTab('info'); }} 
                              className="text-gray-300 hover:text-slate-500 transition"><ICON_SVG.pencil className="w-4 h-4" /></button>
                              <button onClick={() => onDelete(ref.id)} className="text-gray-300 hover:text-red-400 transition"><ICON_SVG.trash className="w-4 h-4" /></button>
                            </div>
                          </div>
                          
                          {ref.description && (
                            <div className="text-sm text-gray-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3 leading-relaxed">
                              {ref.description}
                            </div>
                          )}

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
                              <img src={ref.imageUrl} alt="" className="w-full h-full object-cover cursor-pointer" onClick={() => setViewingDetail(ref)} />
                            )}
                          </div>
                          <div className="p-4 flex flex-col flex-grow">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-lg leading-tight pr-2">{ref.title}</h3>
                              <div className="flex gap-2 shrink-0">
                                <button onClick={() => { 
                                 setEditingId(ref.id); 
                                 setEditData(ref); 
                                 setEditSections(parseSpotContent(ref.description)); // 自動拆解內容
                                 setActiveEditTab('info'); // 預設停在介紹
                                }} className="text-gray-300 hover:text-slate-500"><ICON_SVG.pencil className="w-4 h-4" /></button>
                                <button onClick={() => onDelete(ref.id)} className="text-gray-300 hover:text-red-400"><ICON_SVG.trash className="w-4 h-4" /></button>
                              </div>
                            </div>
                            {/* 只顯示介紹分頁的前兩行 */}
                            <div className="text-sm text-gray-500 line-clamp-2 mb-4">
                              {parseSpotContent(ref.description).info || "暫無介紹..."}
                            </div>
                            <button 
                              onClick={() => setViewingDetail(ref)}
                              className={`mt-auto w-full py-2 rounded-lg text-xs font-bold border transition ${theme.accentText} ${theme.accentBorder} hover:bg-slate-50`}
                            >
                              查看完整內容
                            </button>
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
                                <button onClick={() => { 
                                  setEditingId(ref.id); 
                                  setEditData(ref);
                                  setEditSections(parseSpotContent(ref.description)); 
                                  setActiveEditTab('info');  
                                  }} className="text-gray-300"><ICON_SVG.pencil className="w-3.5 h-3.5" /></button>
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
      {/* --- 景點詳情全螢幕彈窗 --- */}
      {viewingDetail && spotSections && (
        <Modal 
          isOpen={!!viewingDetail} 
          onClose={() => { setViewingDetail(null); setActiveSpotTab('info'); }} 
          title={viewingDetail.title || "景點詳情"}
        >
          {/* 加入 min-h-[400px] 確保容器高度 */}
          <div className="flex flex-col min-h-[400px] max-h-[75vh] overflow-hidden bg-white">
            {viewingDetail.imageUrl && (
              <div className="shrink-0 h-44 sm:h-52 overflow-hidden rounded-xl shadow-sm mb-4">
                <img 
                  src={viewingDetail.imageUrl} 
                  className="w-full h-full object-cover" 
                  alt="景點大圖" 
                />
              </div>
            )}

            {/* 子分頁導覽列 (簡化版，移除 Icon 以確保穩定) */}
            <div className="flex space-x-1 py-2 overflow-x-auto scrollbar-hide border-b border-gray-100 bg-white sticky top-0 z-20 shrink-0">
              {SPOT_SUB_TABS.map(tab => {
                const isSelected = activeSpotTab === tab.id;
                // 檢查該分頁是否有內容
                const hasContent = spotSections[tab.id] && spotSections[tab.id].trim().length > 0;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSpotTab(tab.id)}
                    className={`flex items-center px-4 py-2 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
                      isSelected 
                        ? `${theme.buttonPrimary} text-white shadow-md` 
                        : `${hasContent ? 'text-gray-600' : 'text-gray-300'} bg-gray-50`
                    }`}
                  >
                    {tab.name}
                  </button>
                );
              })}
            </div>

            {/* 內容區域 */}
            <div className="flex-grow overflow-y-auto mt-2 pt-2 pb-12 px-1">
              {spotSections[activeSpotTab] ? (
                <div className="animate-fade-in">
                  <SmartText text={spotSections[activeSpotTab]} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                  <p className="text-xs italic font-medium">這個分頁目前沒有資料喔</p>
                </div>
              )}
              
              {activeSpotTab === 'info' && viewingDetail.url && (
                <a 
                  href={viewingDetail.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-6 flex items-center justify-center w-full py-3 bg-slate-800 text-white rounded-xl text-sm font-bold shadow-lg"
                >
                  前往官方網站 / 更多資訊
                </a>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ReferenceSection;