// src/components/ActivityForm.js
import React, { useState } from "react";
import ImageUpload from "./ImageUpload";
import { ICON_SVG } from "../utils/icons";
import { ACTIVITY_TYPES } from "../utils/constants";
import { useTheme } from "../utils/theme";

const ActivityForm = ({ onSubmit, isSubmitting }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    startTime: "",
    endTime: "",
    description: "",
    type: "other",
    imageUrl: [],
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError("活動標題為必填欄位！");
      return;
    }
    onSubmit(formData);
    setFormData({
      title: "",
      location: "",
      startTime: "",
      endTime: "",
      description: "",
      type: "other",
      imageUrls: [],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
                  ? `${type.bg} ${type.color} ${type.border} font-bold`
                  : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4 mr-1.5" /> {type.name}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="活動標題 *"
          className={`px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none ${theme.ringFocus} ${theme.borderFocus} text-sm`}
          required
        />
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="地點 (選填)"
          className={`px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none ${theme.ringFocus} ${theme.borderFocus} text-sm`}
        />
      </div>
      <div className="flex gap-2 w-full">
        <div className="flex-1 min-w-0">
          <label className="block text-sm font-medium text-gray-700 mb-1 truncate">
            開始時間
          </label>
          <input
            type="time"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            className={`h-10 block w-full bg-white appearance-none px-1 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none ${theme.ringFocus} ${theme.borderFocus} text-sm text-center`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <label className="block text-sm font-medium text-gray-700 mb-1 truncate">
            結束時間
          </label>
          <input
            type="time"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            className={`h-10 block w-full bg-white appearance-none px-1 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none ${theme.ringFocus} ${theme.borderFocus} text-sm text-center`}
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-bold text-gray-500 ml-1 uppercase">
          景點/商品照片 (選填)
        </label>
        <ImageUpload
          currentImages={formData.imageUrl}
          onUploadSuccess={(urls) => setFormData({ ...formData, imageUrl: urls })}
/>
      </div>
      <textarea
        name="description"
        value={formData.description}
        onChange={handleChange}
        rows="3"
        placeholder="詳細說明 (選填)"
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none ${theme.ringFocus} ${theme.borderFocus} text-sm`}
      ></textarea>
      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${theme.buttonPrimary} transition duration-150 ease-in-out disabled:opacity-50 cursor-pointer`}
      >
        {isSubmitting ? "處理中..." : "確認新增活動"}
      </button>
    </form>
  );
};
export default ActivityForm;
