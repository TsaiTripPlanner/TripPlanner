// src/components/ActivityItem.js
import React, { memo, useState } from "react";
import { ICON_SVG } from "../utils/icons";
import {
  morandiAccentColor,
  morandiAccentBorder,
  morandiAccentText,
  morandiSelectedDayButton,
} from "../utils/theme";
import { ACTIVITY_TYPES } from "../App";

// --- 小幫手工具 (原本在 App.js 外面) ---
const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const renderDescriptionWithLinks = (text) => {
  if (!text) return null;
  const parts = text.split(URL_REGEX);
  return parts.map((part, index) => {
    if (!part) return null;
    if (part.match(URL_REGEX))
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-700 underline break-all transition"
        >
          {part}
        </a>
      );
    else return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

const calculateDuration = (start, end) => {
  if (!start || !end) return "";
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const totalStartMinutes = startHour * 60 + startMinute;
  let totalEndMinutes = endHour * 60 + endMinute;
  let durationMinutes = totalEndMinutes - totalStartMinutes;
  if (durationMinutes < 0) durationMinutes += 24 * 60;
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  let durationString = "";
  if (hours > 0) durationString += `${hours}小時`;
  if (minutes > 0) durationString += ` ${minutes}分鐘`;
  return durationString;
};

// --- ActivityItem 元件 ---
const ActivityItem = memo(
  ({
    activity,
    index,
    onDelete,
    onStartEdit,
    isEditing,
    editData,
    onEditChange,
    onSaveEdit,
    onCancelEdit,
    dragHandleProps,
    isDragging,
  }) => {
    // 1. 新增狀態：是否展開詳細內容
    const [isExpanded, setIsExpanded] = useState(false);

    // 2. 極簡風格樣式 (保留上次的修改) + cursor-pointer (讓滑鼠變手指，提示可點擊)
    const cardClasses = `bg-white rounded-lg p-3 transition-all cursor-pointer ${
      isEditing
        ? "shadow-md ring-2 ring-opacity-50 ring-slate-400 border-transparent cursor-default"
        : isDragging
        ? "shadow-2xl ring-2 ring-slate-300 rotate-1 border-transparent z-50"
        : "border border-gray-200 shadow-sm hover:border-gray-300"
    }`;

    const duration = calculateDuration(activity.startTime, activity.endTime);
    const timeDisplay = activity.startTime ? activity.startTime : "未定";

    // 編輯模式的輸入框 helper
    const inputField = (name, label, type = "text") => (
      <div className="mb-2">
        <label
          htmlFor={`edit-${name}-${activity.id}`}
          className="block text-xs font-medium text-gray-500"
        >
          {label}
        </label>
        <input
          type={type}
          id={`edit-${name}-${activity.id}`}
          name={name}
          value={editData[name] || ""}
          onChange={onEditChange}
          // 這裡保留之前修復的手機版輸入框樣式
          className="mt-1 h-9 block w-full min-w-0 max-w-full bg-white appearance-none px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-slate-500 focus:border-slate-500"
          required={name === "title" || name === "location"}
        />
      </div>
    );

    return (
      <div className="flex relative h-full">
        {/* 左側時間軸 (保留之前的優化：寬度 w-14) */}
        <div className="w-14 sm:w-20 text-right flex-shrink-0 pr-2 sm:pr-4 pt-0.5 block pb-8">
          <div
            className={`text-sm sm:text-lg font-bold ${morandiAccentText} leading-snug`}
          >
            {timeDisplay}
          </div>
          {duration && (
            <div className="text-xs text-gray-500 mt-0.5 whitespace-nowrap">
              ({duration})
            </div>
          )}
        </div>

        {/* 中間線條與圓點 (保留之前的優化：mr-2) */}
        <div className="relative flex flex-col items-center flex-shrink-0 mr-2 sm:mr-0 w-4">
          <div
            className={`absolute w-px bg-gray-300 left-1/2 -translate-x-1/2 bottom-0 ${
              index === 0 ? "top-2" : "top-0"
            }`}
          ></div>
          <div
            className={`relative z-10 w-3 h-3 rounded-full ${
              activity.isCompleted ? morandiSelectedDayButton : "bg-gray-400"
            } flex-shrink-0 mt-1`}
          ></div>
        </div>

        {/* 右側卡片本體 */}
        <div
          className={`flex-grow min-w-0 pb-8 ${
            !isEditing ? "sm:ml-4" : "sm:ml-0"
          }`}
        >
          <div
            className={cardClasses}
            // 3. 點擊卡片本體時，切換展開狀態 (但在編輯模式下不觸發)
            onClick={() => !isEditing && setIsExpanded(!isExpanded)}
          >
            {isEditing ? (
              // === 編輯模式 (保持不變) ===
              <div onClick={(e) => e.stopPropagation()}>
                <h4 className={`text-lg font-bold mb-3 ${morandiAccentText}`}>
                  編輯活動
                </h4>
                {/* ★★★ 新增：編輯模式的類別選擇器 */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    活動類別
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ACTIVITY_TYPES.map((type) => {
                      const Icon = ICON_SVG[type.icon];
                      // 檢查目前的編輯資料 editData.type，如果沒有則預設 sightseeing
                      const currentType = editData.type || "sightseeing";
                      const isSelected = currentType === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          // 更新 editData
                          onClick={() =>
                            onEditChange({
                              target: { name: "type", value: type.id },
                            })
                          }
                          className={`flex items-center px-2 py-1 rounded-md border text-xs transition-all ${
                            isSelected
                              ? `${type.bg} ${type.color} ${
                                  type.border
                                } ring-1 ring-offset-1 ring-${
                                  type.color.split("-")[1]
                                }-400 font-bold`
                              : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          <Icon className="w-3 h-3 mr-1" />
                          {type.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {inputField("title", "標題")}
                {inputField("location", "地點")}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {inputField("startTime", "開始時間", "time")}
                  {inputField("endTime", "結束時間", "time")}
                </div>
                <div className="mb-3">
                  <label
                    htmlFor={`edit-description-${activity.id}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    詳細說明
                  </label>
                  <textarea
                    id={`edit-description-${activity.id}`}
                    name="description"
                    value={editData.description || ""}
                    onChange={onEditChange}
                    rows="4"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-slate-500 focus:border-slate-500"
                  ></textarea>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={onCancelEdit}
                    type="button"
                    className="text-gray-600 bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-md text-sm font-medium flex items-center transition"
                  >
                    <ICON_SVG.xMark className="w-4 h-4 mr-1" /> 取消
                  </button>
                  <button
                    onClick={() => onSaveEdit(activity.id)}
                    type="button"
                    className="text-white bg-slate-600 hover:bg-slate-700 px-3 py-1 rounded-md text-sm font-medium flex items-center transition"
                  >
                    <ICON_SVG.check className="w-4 h-4 mr-1" /> 儲存
                  </button>
                </div>
              </div>
            ) : (
              // === 顯示模式 ===
              <div className="flex justify-between items-start">
                <div className="flex-grow min-w-0">
                  <div className="flex items-center mb-1">
                    {/* ★★★ 顯示類別圖示 Badge */}
                    {(() => {
                      const typeData =
                        ACTIVITY_TYPES.find(
                          (t) => t.id === (activity.type || "other")
                        ) || ACTIVITY_TYPES.find((t) => t.id === "other");
                      const Icon = ICON_SVG[typeData.icon];
                      return (
                        <div
                          className={`flex-shrink-0 mr-2 p-1.5 rounded-md ${typeData.bg} ${typeData.color}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                      );
                    })()}

                    <h3 className="text-base font-bold text-gray-800 truncate leading-snug">
                      {activity.title}
                    </h3>
                  </div>

                  {/* 時間區間 (如果有設定) */}
                  {(activity.startTime || activity.endTime) && (
                    <h4 className="text-sm font-semibold text-gray-400 mb-1">
                      {activity.startTime || "?"} ~ {activity.endTime || "?"}
                    </h4>
                  )}

                  {/* 地點 */}
                  <p className="flex items-center text-xs text-gray-500 mt-0.5">
                    <ICON_SVG.mapPin
                      className={`w-3 h-3 mr-1 ${morandiAccentText} flex-shrink-0`}
                    />
                    <span className="truncate">{activity.location}</span>
                  </p>

                  {/* 
                      4. 詳細說明的顯示邏輯 
                         只有在 isExpanded 為 true 時才顯示
                  */}
                  {isExpanded && activity.description && (
                    <div className="mt-3 pt-2 border-t border-gray-100 text-sm text-gray-600 whitespace-pre-wrap animate-fade-in">
                      {renderDescriptionWithLinks(activity.description)}
                    </div>
                  )}

                  {/* 如果有說明文字但沒展開，顯示一個小小的提示箭頭 */}
                  {!isExpanded && activity.description && (
                    <div className="mt-1 text-center">
                      <ICON_SVG.chevronDown className="w-4 h-4 text-gray-300 mx-auto" />
                    </div>
                  )}
                  {isExpanded && activity.description && (
                    <div className="mt-1 text-center">
                      <ICON_SVG.chevronUp className="w-4 h-4 text-gray-300 mx-auto" />
                    </div>
                  )}
                </div>

                {/* 右側按鈕區：這區要阻止點擊事件冒泡 (e.stopPropagation) */}
                <div
                  className="flex flex-col space-y-2 flex-shrink-0 ml-2 pt-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex space-x-1 justify-end">
                    <button
                      onClick={() => onStartEdit(activity)}
                      className={`text-gray-400 hover:text-${morandiAccentColor}-600 transition p-1`}
                    >
                      <ICON_SVG.pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDelete(activity.id)}
                      className="text-gray-400 hover:text-red-500 transition p-1"
                    >
                      <ICON_SVG.trash className="w-5 h-5" />
                    </button>
                  </div>
                  <div
                    {...dragHandleProps}
                    className="flex items-center justify-center p-2 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing hover:bg-gray-100 rounded transition"
                  >
                    <ICON_SVG.menu className="w-6 h-6" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);
export default ActivityItem;
