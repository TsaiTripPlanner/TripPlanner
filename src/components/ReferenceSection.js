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

  // 自動抓取網頁資訊
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

  const getFavicon = (url) => {
    try {
      const hostname = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
    } catch {
      return null;
    }
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
          className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full hover:bg-gray-200 transition"
        >
          {showGuide ? "隱藏說明" : "操作說明"}
        </button>
      </div>

      {/* 操作說明區塊 */}
      {showGuide && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-900 leading-relaxed animate-fade-in">
          <p className="font-bold mb-1">💡 參考資料使用教學：</p>
          <ul className="list-disc ml-4 space-y-1">
            <li>
              <strong>自動抓取：</strong>
              貼上網址後點擊「抓取」，系統會自動帶入標題、圖片與描述。
            </li>
            <li>
              <strong>手動圖片：</strong>若想放自己的照片，請先上傳至{" "}
              <a
                href="https://imgur.com/upload"
                target="_blank"
                className="underline font-bold"
              >
                Imgur
              </a>
              ，再將「圖片位址 (.jpg)」貼到圖片 URL 欄位。
            </li>
            <li>
              <strong>自定義：</strong>所有欄位在抓取後皆可手動修改。
            </li>
          </ul>
        </div>
      )}

      {/* 新增表單區塊 */}
      <form
        onSubmit={handleSubmit}
        className={`mb-8 p-4 ${theme.infoBoxBg} rounded-lg border ${theme.infoBoxBorder} space-y-4`}
      >
        {/* 1. 網址與抓取按鈕 */}
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
              className="flex-grow min-w-0 px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-slate-300"
            />
            <button
              type="button"
              onClick={fetchMetadata}
              className="shrink-0 px-4 py-2 bg-white border border-gray-300 rounded-md text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
            >
              {isFetching ? "..." : "抓取"}
            </button>
          </div>
        </div>

        {/* 2. 標題 (選填) */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">
            標題 (選填，抓取後可修改)
          </label>
          <input
            type="text"
            placeholder="例如：飯店訂單、機票截圖"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>

        {/* 3. 圖片 URL 與 備註 (手機版垂直排版) */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">
              圖片 URL (選填)
            </label>
            <input
              type="text"
              placeholder="貼上圖片連結 .jpg / .png"
              value={formData.imageUrl}
              onChange={(e) =>
                setFormData({ ...formData, imageUrl: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">
              備註/描述 (選填)
            </label>
            <input
              type="text"
              placeholder="簡單備註說明"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
        </div>

        <button
          type="submit"
          className={`w-full py-2.5 rounded-md text-white font-bold ${theme.buttonPrimary} shadow-md active:scale-[0.98] transition`}
        >
          新增到參考資料
        </button>
      </form>

      {/* 列表展示 */}
      <div className="space-y-4">
        {references.length === 0 ? (
          <p className="text-center py-10 text-gray-400 italic text-sm">
            點擊上方按鈕查看如何新增圖片資料
          </p>
        ) : (
          references.map((ref) => (
            <div key={ref.id} className="relative group">
              <div
                className={`flex border ${theme.cardBorder} rounded-xl overflow-hidden bg-white hover:shadow-md transition min-h-[100px]`}
              >
                {/* 文字資訊 */}
                <div className="flex-grow p-3 sm:p-4 min-w-0 flex flex-col justify-between">
                  <div className="min-w-0">
                    <h3
                      className={`font-bold text-sm sm:text-base mb-1 truncate ${theme.cardTitle}`}
                    >
                      {ref.title}
                    </h3>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {ref.description || "點擊網址查看詳情"}
                    </p>
                  </div>

                  <div className="flex items-center mt-2">
                    {ref.url && (
                      <div className="flex items-center min-w-0">
                        <img
                          src={getFavicon(ref.url)}
                          alt=""
                          className="w-3.5 h-3.5 mr-2 flex-shrink-0"
                        />
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] sm:text-[11px] text-blue-500 hover:underline truncate"
                        >
                          {ref.url.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* 右側縮圖 */}
                {ref.imageUrl && (
                  <div
                    className="w-24 sm:w-36 bg-gray-50 flex-shrink-0 border-l border-gray-100 cursor-pointer overflow-hidden"
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
          ))
        )}
      </div>
    </div>
  );
};

export default ReferenceSection;
