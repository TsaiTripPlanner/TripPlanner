// src/components/ActivityForm.js
import React, { useState } from "react";
import { ICON_SVG } from "../utils/icons";
import { ACTIVITY_TYPES } from "../utils/constants"; // 記得從常數拿
import { morandiButtonPrimary, morandiAccentColor } from "../utils/theme";

const ActivityForm = ({ onSubmit }) => {
  // 1. 把原本在 TripDetails 的表單狀態搬進來
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    startTime: "",
    endTime: "",
    description: "",
    type: "other",
  });
  const [error, setError] = useState("");

  // 2. 處理輸入變更
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  // 3. 處理送出
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError("活動標題為必填欄位！");
      return;
    }
    // 把乾淨的資料交給父母元件，並重置表單
    onSubmit(formData);
    setFormData({
      title: "",
      location: "",
      startTime: "",
      endTime: "",
      description: "",
      type: "other",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 類別選擇按鈕 (水平滑動) */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {ACTIVITY_TYPES.map((type) => {
          const Icon = ICON_SVG[type.icon];
          const isSelected = formData.type === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => setFormData({ ...formData, type: type.id })}
              className={`flex items-center flex-shrink-0 px-3 py-1.5 rounded-full border text-sm transition-all ${
                isSelected
                  ? `${type.bg} ${type.color} ${
                      type.border
                    } ring-1 ring-offset-1 ring-${
                      type.color.split("-")[1]
                    }-400 font-bold`
                  : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4 mr-1.5" />
              {type.name}
            </button>
          );
        })}
      </div>

      {/* 標題與地點 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="活動標題 *"
          className={`px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${morandiAccentColor}-500 focus:border-${morandiAccentColor}-500 text-sm`}
          required
        />
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="地點 (選填)"
          className={`px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${morandiAccentColor}-500 focus:border-${morandiAccentColor}-500 text-sm`}
        />
      </div>

      {/* 時間 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            開始時間
          </label>
          <input
            type="time"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            className={`h-10 block w-full bg-white px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${morandiAccentColor}-500 focus:border-${morandiAccentColor}-500 text-sm`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            結束時間
          </label>
          <input
            type="time"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            className={`h-10 block w-full bg-white px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${morandiAccentColor}-500 focus:border-${morandiAccentColor}-500 text-sm`}
          />
        </div>
      </div>

      {/* 描述 */}
      <textarea
        name="description"
        value={formData.description}
        onChange={handleChange}
        rows="3"
        placeholder="詳細說明 (選填)"
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${morandiAccentColor}-500 focus:border-${morandiAccentColor}-500 text-sm`}
      ></textarea>

      {/* 錯誤訊息與按鈕 */}
      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

      <button
        type="submit"
        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${morandiButtonPrimary} transition duration-150 ease-in-out`}
      >
        確認新增活動
      </button>
    </form>
  );
};

export default ActivityForm;
