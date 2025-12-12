// src/components/ActivityItem.js
import React, { memo } from "react";
import { ICON_SVG } from "../utils/icons";
import {
  morandiAccentColor,
  morandiAccentBorder,
  morandiAccentText,
  morandiSelectedDayButton,
} from "../utils/theme";

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
    const cardClasses = `bg-white rounded-xl shadow-lg p-4 transition-all ${
      isEditing
        ? "shadow-xl ring-2 ring-opacity-50 ring-slate-500"
        : isDragging
        ? "shadow-2xl ring-2 ring-slate-300 rotate-1"
        : "hover:shadow-xl"
    } border-l-4 ${morandiAccentBorder}`;

    const duration = calculateDuration(activity.startTime, activity.endTime);
    const timeDisplay = activity.startTime ? activity.startTime : "未定";
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
          className="mt-1 block w-full px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-slate-500 focus:border-slate-500"
          required={name === "title" || name === "location"}
        />
      </div>
    );

    return (
      <div className="flex relative h-full">
        <div className="w-20 text-right flex-shrink-0 pr-4 pt-0.5 hidden sm:block pb-8">
          <div
            className={`text-lg font-bold ${morandiAccentText} leading-snug`}
          >
            {timeDisplay}
          </div>
          {duration && (
            <div className="text-xs text-gray-500 mt-0.5 whitespace-nowrap">
              ({duration})
            </div>
          )}
        </div>
        {/* 修改中間欄位開始 */}
        <div className="relative flex flex-col items-center flex-shrink-0 mr-4 sm:mr-0 w-4">
          {/* 絕對定位的線條 */}
          <div
            className={`absolute w-px bg-gray-300 left-1/2 -translate-x-1/2 bottom-0 ${
              index === 0 ? "top-2" : "top-0"
            }`}
          ></div>
          {/* 圓點 */}
          <div
            className={`relative z-10 w-3 h-3 rounded-full ${
              activity.isCompleted ? morandiSelectedDayButton : "bg-gray-400"
            } flex-shrink-0 mt-1`}
          ></div>
        </div>
        {/* 右側欄位 */}
        <div
          className={`flex-grow min-w-0 pb-8 ${
            !isEditing ? "sm:ml-4" : "sm:ml-0"
          }`}
        >
          <div className={cardClasses}>
            {isEditing ? (
              <div>
                <h4 className={`text-lg font-bold mb-3 ${morandiAccentText}`}>
                  編輯活動
                </h4>
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
              <div className="flex justify-between items-start">
                <div className="flex-grow min-w-0">
                  <h3 className="text-lg font-bold text-gray-800 truncate leading-snug">
                    {activity.title}
                  </h3>
                  {(activity.startTime || activity.endTime) && (
                    <h4 className="text-sm font-semibold text-gray-400 mb-1">
                      {activity.startTime || "?"} ~ {activity.endTime || "?"}
                    </h4>
                  )}
                  <p className="flex items-center text-xs text-gray-500 mt-1">
                    <ICON_SVG.mapPin
                      className={`w-3 h-3 mr-1 ${morandiAccentText} flex-shrink-0`}
                    />
                    <span className="truncate">{activity.location}</span>
                  </p>
                  {activity.description && (
                    <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                      {renderDescriptionWithLinks(activity.description)}
                    </p>
                  )}
                </div>
                <div className="flex flex-col space-y-2 flex-shrink-0 ml-4 pt-1">
                  <div className="flex space-x-1 justify-end">
                    <button
                      onClick={() => onStartEdit(activity)}
                      className={`text-gray-400 hover:text-${morandiAccentColor}-600 transition p-1`}
                    >
                      {" "}
                      <ICON_SVG.pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDelete(activity.id)}
                      className="text-gray-400 hover:text-red-500 transition p-1"
                    >
                      {" "}
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
