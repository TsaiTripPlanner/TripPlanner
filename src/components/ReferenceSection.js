import React, { useState } from "react";
import { ICON_SVG } from "../utils/icons";
import { useTheme } from "../utils/theme";
import ImageUpload from "./ImageUpload";

const ReferenceSection = ({ references, onAdd, onUpdate, onDelete }) => {
  const { theme } = useTheme();
  
  const [activeTab, setActiveTab] = useState("spot");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  
  // 用於控制「景點介紹」的展開/收合
  const [expandedIds, setExpandedIds] = useState(new Set());

  const [newData, setNewData] = useState({
    title: "",
    url: "",
    imageUrl: "",
    description: "",
  });
  const [isFetching, setIsFetching] = useState(false);

  const filteredRefs = references.filter(
    (ref) => (ref.type || "link") === activeTab
  );

  const toggleExpand = (id) => {
    const newIds = new Set(expandedIds);
    if (newIds.has(id)) newIds.delete(id);
    else newIds.add(id);
    setExpandedIds(newIds);
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
          <ICON_SVG.paperClip className="w-6 h-6 mr-2" /> 參考資料庫
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={`p-2 rounded-full text-white shadow-md ${theme.buttonPrimary}`}
        >
          {showAddForm ? <ICON_SVG.xMark className="w-6 h-6" /> : <ICON_SVG.plusSmall className="w-6 h-6" />}
        </button>
      </div>

      {/* --- 子分頁切換 --- */}
      <div className="flex space-x-2 mb-6 border-b border-gray-100">
        {[
          { id: "spot", name: "景點介紹", icon: "camera" },
          { id: "link", name: "交通/攻略", icon: "link" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setEditingId(null); setShowAddForm(false); }}
            className={`flex items-center px-4 py-2 text-sm font-bold transition ${
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
        <div className="mb-8 p-4 bg-gray-50 rounded-lg border space-y-4 animate-fade-in">
          {activeTab === "link" && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="貼上攻略網址..."
                value={newData.url}
                onChange={(e) => setNewData({ ...newData, url: e.target.value })}
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              />
              <button onClick={() => fetchMetadata(newData.url)} className="shrink-0 px-3 py-2 bg-white border rounded text-xs font-bold shadow-sm">
                {isFetching ? "..." : "自動填寫"}
              </button>
            </div>
          )}
          <input
            type="text"
            placeholder="標題 *"
            value={newData.title}
            onChange={(e) => setNewData({ ...newData, title: e.target.value })}
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
          <ImageUpload currentImage={newData.imageUrl} onUploadSuccess={(url) => setNewData({ ...newData, imageUrl: url })} />
          <textarea
            placeholder="描述..."
            value={newData.description}
            onChange={(e) => setNewData({ ...newData, description: e.target.value })}
            rows="3"
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
          <button onClick={handleAddNew} className={`w-full py-2 rounded-md text-white font-bold ${theme.buttonPrimary}`}>確認新增</button>
        </div>
      )}

      {/* --- 列表區 --- */}
      <div className={activeTab === "spot" ? "grid grid-cols-1 sm:grid-cols-2 gap-6" : "space-y-4"}>
        {filteredRefs.map((ref) => (
          <div key={ref.id} className="relative bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition">
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
            ) : activeTab === "spot" ? (
              /* === 景點佈局 (網格) === */
              <div className="flex flex-col h-full">
                <div className="aspect-video w-full overflow-hidden bg-gray-100">
                  {ref.imageUrl && (
                    <img src={ref.imageUrl} alt="" className="w-full h-full object-cover" onClick={() => window.open(ref.imageUrl)} />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg leading-tight">{ref.title}</h3>
                    <div className="flex gap-2">
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
              /* === 攻略佈局 (橫式書籤) === */
              <div className="flex p-3 gap-3">
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
                    <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 mt-1 flex items-center hover:underline">
                      <ICON_SVG.link className="w-3 h-3 mr-1" /> 開啟攻略連結
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {filteredRefs.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-400 text-sm">此分類目前沒有資料</div>
        )}
      </div>
    </div>
  );
};

export default ReferenceSection;