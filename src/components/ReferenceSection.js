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

  // 輔助函式：開啟地圖
  const openGoogleMaps = (e, title) => {
    e.stopPropagation();
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title)}`, "_blank");
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-xl font-bold flex items-center ${theme.accentText}`}>
          <ICON_SVG.paperClip className="w-6 h-6 mr-2" /> 參考資料庫
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={`flex items-center px-4 py-2 rounded-full text-white shadow-md ${theme.buttonPrimary} transition-all active:scale-95`}
        >
          {showAddForm ? <ICON_SVG.xMark className="w-5 h-5 mr-1" /> : <ICON_SVG.plusSmall className="w-5 h-5 mr-1" />}
          <span className="text-sm font-bold">{showAddForm ? "取消" : "新增資料"}</span>
        </button>
      </div>

      {/* --- 子分頁切換 --- */}
      <div className="flex space-x-2 mb-6 bg-gray-100 p-1 rounded-xl">
        {[
          { id: "spot", name: "景點清單", icon: "camera" },
          { id: "link", name: "交通/攻略", icon: "link" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setEditingId(null);
              setShowAddForm(false);
            }}
            className={`flex-1 flex items-center justify-center py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab.id
                ? `bg-white ${theme.accentText} shadow-sm`
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {(() => {
              const Icon = ICON_SVG[tab.icon];
              return <Icon className="w-4 h-4 mr-1.5" />;
            })()}
            {tab.name}
          </button>
        ))}
      </div>

      {/* --- 新增表單 (優化過的樣式) --- */}
      {showAddForm && (
        <div className="mb-8 p-5 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 space-y-4 animate-fade-in">
          <div className="flex items-center text-gray-500 font-bold text-sm border-b pb-2 mb-2">
            正在新增 {activeTab === "spot" ? "私藏景點" : "實用攻略"}
          </div>
          {activeTab === "link" && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="貼上網址自動抓取資料..."
                value={newData.url}
                onChange={(e) => setNewData({ ...newData, url: e.target.value })}
                className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white"
              />
              <button
                onClick={() => fetchMetadata(newData.url)}
                className="shrink-0 px-4 py-2 bg-slate-600 text-white rounded-lg text-xs font-bold shadow-sm active:bg-slate-700"
              >
                {isFetching ? "抓取中..." : "自動填寫"}
              </button>
            </div>
          )}
          <input
            type="text"
            placeholder="標題 (必填)"
            value={newData.title}
            onChange={(e) => setNewData({ ...newData, title: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
          <ImageUpload
            currentImage={newData.imageUrl}
            onUploadSuccess={(url) => setNewData({ ...newData, imageUrl: url })}
          />
          <textarea
            placeholder="這地方有什麼吸引你的？或是這篇攻略的重點..."
            value={newData.description}
            onChange={(e) => setNewData({ ...newData, description: e.target.value })}
            rows="3"
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
          <button
            onClick={handleAddNew}
            className={`w-full py-3 rounded-lg text-white font-bold shadow-md ${theme.buttonPrimary} active:scale-[0.98] transition-all`}
          >
            完成並儲存
          </button>
        </div>
      )}

      {/* --- 列表區：採用 Grid 網格佈局 --- */}
      <div className={`grid gap-4 ${activeTab === "spot" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
        {filteredRefs.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
             <ICON_SVG.paperClip className="w-12 h-12 text-gray-200 mx-auto mb-2" />
             <p className="text-gray-400 text-sm">點擊右上角 + 開始收集資料</p>
          </div>
        ) : (
          filteredRefs.map((ref) => (
            <div
              key={ref.id}
              className={`group relative bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
                editingId === ref.id ? "ring-2 ring-slate-400 border-transparent" : ""
              }`}
            >
              {editingId === ref.id ? (
                /* === 編輯模式 (維持原邏輯，優化 UI) === */
                <div className="p-4 space-y-3 bg-slate-50">
                  <input
                    type="text"
                    value={editData.title}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                  <ImageUpload
                    currentImage={editData.imageUrl}
                    onUploadSuccess={(url) => setEditData({ ...editData, imageUrl: url })}
                  />
                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    rows="4"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-gray-200 rounded-lg text-xs">取消</button>
                    <button onClick={() => handleSave(ref.id)} className={`px-4 py-2 text-white rounded-lg text-xs ${theme.buttonPrimary}`}>儲存修改</button>
                  </div>
                </div>
              ) : (
                /* === 顯示模式 (雜誌風格) === */
                <div className="flex flex-col h-full">
                  {/* 圖片區域 */}
                  <div className="relative aspect-[16/9] overflow-hidden">
                    {ref.imageUrl ? (
                      <img
                        src={ref.imageUrl}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                        <ICON_SVG.camera className="w-8 h-8" />
                      </div>
                    )}
                    
                    {/* 圖片上方的快速按鈕 (毛玻璃質感) */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingId(ref.id); setEditData(ref); }}
                        className="p-1.5 bg-white/80 backdrop-blur rounded-full text-gray-600 hover:text-blue-500 shadow-sm"
                      >
                        <ICON_SVG.pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(ref.id)}
                        className="p-1.5 bg-white/80 backdrop-blur rounded-full text-gray-600 hover:text-red-500 shadow-sm"
                      >
                        <ICON_SVG.trash className="w-4 h-4" />
                      </button>
                    </div>

                    {/* 地點標籤 (如果是景點且有地點) */}
                    {activeTab === "spot" && (
                      <button
                        onClick={(e) => openGoogleMaps(e, ref.title)}
                        className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur text-white text-[10px] rounded-md hover:bg-black/70 transition"
                      >
                        <ICON_SVG.mapPin className="w-3 h-3" />
                        Google Maps
                      </button>
                    )}
                  </div>

                  {/* 內容文字區 */}
                  <div className="p-4 flex-grow flex flex-col">
                    <h3 className="font-bold text-gray-800 text-lg mb-2 line-clamp-1">{ref.title}</h3>
                    <p className={`text-sm text-gray-500 leading-relaxed whitespace-pre-wrap ${activeTab === "spot" ? "line-clamp-3" : "line-clamp-2"}`}>
                      {ref.description || "尚未填寫詳細內容..."}
                    </p>
                    
                    {/* 攻略分頁顯示連結按鈕 */}
                    {activeTab === "link" && ref.url && (
                      <div className="mt-auto pt-4">
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-full py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                        >
                          <ICON_SVG.link className="w-3.5 h-3.5 mr-1.5 text-blue-500" /> 閱讀完整攻略
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReferenceSection;