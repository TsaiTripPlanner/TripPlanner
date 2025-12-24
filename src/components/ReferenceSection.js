// src/components/ReferenceSection.js
import React, { useState } from "react";
import { ICON_SVG } from "../utils/icons";
import { useTheme } from "../utils/theme";
import ImageUpload from "./ImageUpload";

const ReferenceSection = ({ references, onAdd, onUpdate, onDelete }) => {
  const { theme } = useTheme();

  // 目前顯示哪一類： "spot" (景點) 或 "link" (資料/攻略)
  const [activeTab, setActiveTab] = useState("spot");

  // 控制編輯狀態
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  // 控制新增表單
  const [showAddForm, setShowAddForm] = useState(false);
  const [newData, setNewData] = useState({
    title: "",
    url: "",
    imageUrl: "",
    description: "",
  });
  const [isFetching, setIsFetching] = useState(false);

  // 1. 過濾資料
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

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2
          className={`text-xl font-bold flex items-center ${theme.accentText}`}
        >
          <ICON_SVG.paperClip className="w-6 h-6 mr-2" /> 參考資料庫
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={`p-2 rounded-full text-white shadow-md ${theme.buttonPrimary}`}
        >
          {showAddForm ? (
            <ICON_SVG.xMark className="w-5 h-5" />
          ) : (
            <ICON_SVG.plusSmall className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* --- 子分頁切換 --- */}
      <div className="flex space-x-2 mb-6 border-b border-gray-100 pb-1">
        {[
          { id: "spot", name: "景點介紹", icon: "camera" },
          { id: "link", name: "交通/攻略", icon: "link" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setEditingId(null);
              setShowAddForm(false);
            }}
            className={`flex items-center px-4 py-2 rounded-t-lg text-sm font-bold transition ${
              activeTab === tab.id
                ? `${theme.accentText} border-b-2 ${theme.accentBorder}`
                : "text-gray-400"
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

      {/* --- 新增表單 --- */}
      {showAddForm && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-500">
              新增{activeTab === "spot" ? "景點" : "攻略"}
            </span>
          </div>
          {activeTab === "link" && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="輸入網址..."
                value={newData.url}
                onChange={(e) =>
                  setNewData({ ...newData, url: e.target.value })
                }
                className="flex-grow px-3 py-2 border rounded-md text-sm"
              />
              <button
                onClick={() => fetchMetadata(newData.url)}
                className="px-3 py-2 bg-white border rounded text-xs"
              >
                {isFetching ? "..." : "抓取"}
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
          <ImageUpload
            currentImage={newData.imageUrl}
            onUploadSuccess={(url) => setNewData({ ...newData, imageUrl: url })}
          />
          <textarea
            placeholder="詳細描述..."
            value={newData.description}
            onChange={(e) =>
              setNewData({ ...newData, description: e.target.value })
            }
            rows="3"
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
          <button
            onClick={handleAddNew}
            className={`w-full py-2 rounded-md text-white font-bold ${theme.buttonPrimary}`}
          >
            確認新增
          </button>
        </div>
      )}

      {/* --- 列表區 --- */}
      <div className="space-y-6">
        {filteredRefs.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            此分類目前沒有資料
          </div>
        ) : (
          filteredRefs.map((ref) => (
            <div
              key={ref.id}
              className="relative bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition"
            >
              {editingId === ref.id ? (
                /* === 編輯模式 === */
                <div className="p-4 space-y-3 bg-slate-50">
                  <input
                    type="text"
                    value={editData.title}
                    onChange={(e) =>
                      setEditData({ ...editData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editData.url || ""}
                      onChange={(e) =>
                        setEditData({ ...editData, url: e.target.value })
                      }
                      className="flex-grow px-3 py-2 border rounded text-sm"
                      placeholder="網址 (選填)"
                    />
                    <button
                      onClick={() => fetchMetadata(editData.url)}
                      className="px-2 py-1 bg-white border rounded text-xs"
                    >
                      重新抓取
                    </button>
                  </div>
                  <ImageUpload
                    currentImage={editData.imageUrl}
                    onUploadSuccess={(url) =>
                      setEditData({ ...editData, imageUrl: url })
                    }
                  />
                  <textarea
                    value={editData.description}
                    onChange={(e) =>
                      setEditData({ ...editData, description: e.target.value })
                    }
                    rows="4"
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 bg-gray-200 rounded text-xs"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleSave(ref.id)}
                      className={`px-3 py-1 text-white rounded text-xs ${theme.buttonPrimary}`}
                    >
                      儲存
                    </button>
                  </div>
                </div>
              ) : (
                /* === 顯示模式 === */
                <div
                  className={`flex flex-col ${
                    activeTab === "spot" ? "" : "sm:flex-row"
                  }`}
                >
                  {ref.imageUrl && (
                    <div
                      className={`${
                        activeTab === "spot"
                          ? "w-full h-48"
                          : "w-full sm:w-32 h-32"
                      } shrink-0`}
                    >
                      <img
                        src={ref.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        onClick={() => window.open(ref.imageUrl)}
                      />
                    </div>
                  )}
                  <div className="p-4 flex-grow">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg mb-1">{ref.title}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingId(ref.id);
                            setEditData(ref);
                          }}
                          className="text-gray-300 hover:text-slate-500"
                        >
                          <ICON_SVG.pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(ref.id)}
                          className="text-gray-300 hover:text-red-400"
                        >
                          <ICON_SVG.trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p
                      className={`text-sm text-gray-500 whitespace-pre-wrap ${
                        activeTab === "spot" ? "" : "line-clamp-2"
                      }`}
                    >
                      {ref.description}
                    </p>
                    {ref.url && (
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-blue-500 mt-2 hover:underline"
                      >
                        <ICON_SVG.link className="w-3 h-3 mr-1" /> 開啟連結
                      </a>
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
