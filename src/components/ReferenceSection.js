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
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onAdd(formData);
    setFormData({ title: "", url: "", imageUrl: "" });
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
      <h2
        className={`text-xl font-bold flex items-center mb-6 ${theme.accentText}`}
      >
        <ICON_SVG.paperClip className="w-6 h-6 mr-2" /> 參考資料
      </h2>

      {/* 新增表單 */}
      <form
        onSubmit={handleSubmit}
        className={`mb-8 p-4 ${theme.infoBoxBg} rounded-lg border ${theme.infoBoxBorder} space-y-3`}
      >
        <input
          type="text"
          placeholder="標題 (如: 飯店確認單、機場地圖)"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="連結 URL (選填)"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            className="flex-grow px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <input
            type="text"
            placeholder="圖片 URL (選填)"
            value={formData.imageUrl}
            onChange={(e) =>
              setFormData({ ...formData, imageUrl: e.target.value })
            }
            className="flex-grow px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        <button
          type="submit"
          className={`w-full py-2 rounded-md text-white font-medium ${theme.buttonPrimary} transition`}
        >
          新增資料
        </button>
      </form>

      {/* 列表展示 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {references.map((ref) => (
          <div
            key={ref.id}
            className={`border ${theme.cardBorder} rounded-lg overflow-hidden flex flex-col bg-white shadow-sm`}
          >
            {ref.imageUrl && (
              <img
                src={ref.imageUrl}
                alt={ref.title}
                className="w-full h-40 object-cover border-b"
              />
            )}
            <div className="p-3 flex justify-between items-center">
              <div className="min-w-0">
                <h3 className={`font-bold text-sm truncate ${theme.cardTitle}`}>
                  {ref.title}
                </h3>
                {ref.url && (
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline flex items-center mt-1"
                  >
                    <ICON_SVG.link className="w-3 h-3 mr-1" /> 開啟連結
                  </a>
                )}
              </div>
              <button
                onClick={() => onDelete(ref.id)}
                className="text-gray-300 hover:text-red-500 p-1"
              >
                <ICON_SVG.trash className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReferenceSection;
