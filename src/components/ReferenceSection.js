// src/components/ReferenceSection.js
import React, { useState } from "react";
import { ICON_SVG } from "../utils/icons";
import { useTheme } from "../utils/theme";

const ReferenceSection = ({ references, onAdd, onDelete }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    imageUrl: "",
    description: "",
  });
  const [isFetching, setIsFetching] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const fetchMetadata = async () => {
    if (!formData.url.trim()) return;
    setIsFetching(true);
    try {
      const response = await fetch(
        `https://api.microlink.io?url=${encodeURIComponent(formData.url)}`
      );
      const result = await response.json();
      if (result.status === "success") {
        const { data } = result;
        setFormData((prev) => ({
          ...prev,
          title: data.title || prev.title || "",
          imageUrl: data.image?.url || data.logo?.url || prev.imageUrl || "",
          description: data.description || prev.description || "",
        }));
      }
    } catch (error) {
      console.error("抓取失敗", error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalTitle =
      formData.title.trim() ||
      (formData.url ? new URL(formData.url).hostname : "未命名參考資料");
    onAdd({ ...formData, title: finalTitle });
    setFormData({ title: "", url: "", imageUrl: "", description: "" });
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2
          className={`text-xl font-bold flex items-center ${theme.accentText}`}
        >
          <ICON_SVG.paperClip className="w-6 h-6 mr-2" /> 參考資料
        </h2>
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full"
        >
          {showGuide ? "隱藏說明" : "操作說明"}
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className={`mb-8 p-4 ${theme.infoBoxBg} rounded-lg border ${theme.infoBoxBorder} space-y-4`}
      >
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">
            網址 URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="https://..."
              value={formData.url}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
              className={`flex-grow min-w-0 px-3 py-2 border border-gray-300 rounded-md text-sm outline-none ${theme.ringFocus}`}
            />
            <button
              type="button"
              onClick={fetchMetadata}
              className="shrink-0 px-4 py-2 bg-white border border-gray-300 rounded-md text-xs font-bold text-gray-600"
            >
              {isFetching ? "..." : "抓取"}
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">
            標題
          </label>
          <input
            type="text"
            placeholder="抓取後可修改"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none ${theme.ringFocus}`}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">
              圖片 URL
            </label>
            <input
              type="text"
              placeholder="貼上連結"
              value={formData.imageUrl}
              onChange={(e) =>
                setFormData({ ...formData, imageUrl: e.target.value })
              }
              className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none ${theme.ringFocus}`}
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">
              備註
            </label>
            <input
              type="text"
              placeholder="簡單說明"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none ${theme.ringFocus}`}
            />
          </div>
        </div>
        <button
          type="submit"
          className={`w-full py-2.5 rounded-md text-white font-bold ${theme.buttonPrimary} shadow-md`}
        >
          新增到參考資料
        </button>
      </form>

      <div className="space-y-4">
        {references.map((ref) => (
          <div key={ref.id} className="relative group">
            <div
              className={`flex border ${theme.cardBorder} rounded-xl overflow-hidden bg-white hover:shadow-md transition min-h-[100px]`}
            >
              <div className="flex-grow p-3 sm:p-4 min-w-0 flex flex-col justify-between">
                <h3
                  className={`font-bold text-sm sm:text-base mb-1 truncate ${theme.cardTitle}`}
                >
                  {ref.title}
                </h3>
                <p className="text-xs text-gray-400 line-clamp-2">
                  {ref.description || "點擊網址查看詳情"}
                </p>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-500 hover:underline truncate mt-2"
                >
                  {ref.url}
                </a>
              </div>
              {ref.imageUrl && (
                <div
                  className="w-24 sm:w-36 bg-gray-50 flex-shrink-0 border-l border-gray-100"
                  onClick={() => window.open(ref.imageUrl)}
                >
                  <img
                    src={ref.imageUrl}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
              )}
              <button
                onClick={() => onDelete(ref.id)}
                className="absolute -top-2 -right-2 bg-gray-800 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg z-10"
              >
                <ICON_SVG.xMark className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ReferenceSection;
