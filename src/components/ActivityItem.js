// src/components/ActivityItem.js
import React, { memo, useState } from "react";
import { ICON_SVG } from "../utils/icons";
import { ACTIVITY_TYPES } from "../utils/constants";
import { useTheme } from "../utils/theme";

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

// ★ 修改重點：縮短時長文字顯示 (例如 1h 30m)
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
  if (hours > 0) durationString += `${hours}h`;
  if (minutes > 0) durationString += ` ${minutes}m`;
  return durationString.trim();
};

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
    totalDays,
  }) => {
    const { theme } = useTheme();
    const [isExpanded, setIsExpanded] = useState(false);

    const cardClasses = `${
      theme.cardBg
    } rounded-lg p-3 transition-all cursor-pointer ${
      isEditing
        ? `shadow-md ring-2 ring-opacity-50 ring-${theme.accent}-400 border-transparent cursor-default`
        : isDragging
        ? `shadow-2xl ring-2 ring-${theme.accent}-300 rotate-1 border-transparent z-50`
        : `border ${theme.cardBorder} shadow-sm hover:border-${theme.accent}-300`
    }`;

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
          className="mt-1 h-9 block w-full min-w-0 max-w-full bg-white appearance-none px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-slate-500 focus:border-slate-500"
          required={name === "title"}
        />
      </div>
    );

    return (
      <div className="flex relative h-full">
        {/* ★ 修改重點：調整手機版寬度為 w-16 (原為 w-14)，並移除 whitespace-nowrap */}
        <div className="w-16 sm:w-20 text-right flex-shrink-0 pr-2 sm:pr-4 pt-0.5 block pb-8">
          <div
            className={`text-sm sm:text-lg font-bold ${theme.accentText} leading-snug`}
          >
            {timeDisplay}
          </div>
          {duration && (
            <div
              className={`text-[10px] sm:text-xs ${theme.cardMeta} mt-0.5 opacity-80`}
            >
              ({duration})
            </div>
          )}
        </div>

        {/* 中間線條與圓點 */}
        <div className="relative flex flex-col items-center flex-shrink-0 mr-2 sm:mr-0 w-4">
          <div
            className={`absolute w-px ${
              theme.timelineLine
            } left-1/2 -translate-x-1/2 bottom-0 ${
              index === 0 ? "top-2" : "top-0"
            }`}
          ></div>
          <div
            className={`relative z-10 w-3 h-3 rounded-full ${
              activity.isCompleted
                ? theme.selectedDayButton
                : theme.timelineDotPassive
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
            onClick={() => !isEditing && setIsExpanded(!isExpanded)}
          >
            {isEditing ? (
              // === 編輯模式 ===
              <div onClick={(e) => e.stopPropagation()}>
                <h4 className={`text-lg font-bold mb-3 ${theme.accentText}`}>
                  編輯活動
                </h4>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    活動類別
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ACTIVITY_TYPES.map((type) => {
                      const Icon = ICON_SVG[type.icon];
                      const currentType = editData.type || "other";
                      const isSelected = currentType === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() =>
                            onEditChange({
                              target: { name: "type", value: type.id },
                            })
                          }
                          className={`flex items-center px-2 py-1 rounded-md border text-xs transition-all ${
                            isSelected
                              ? `${type.bg} ${type.color} ${type.border} font-bold`
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
                {totalDays > 1 && (
                  <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      移動至其他天 (Day)
                    </label>
                    <div className="relative">
                      <select
                        name="day"
                        value={editData.day || activity.day}
                        onChange={(e) =>
                          onEditChange({
                            target: {
                              name: "day",
                              value: parseInt(e.target.value),
                            },
                          })
                        }
                        className="block w-full py-2 px-3 border border-slate-300 bg-white text-slate-700 rounded-md text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition-colors cursor-pointer"
                      >
                        {Array.from({ length: totalDays }, (_, i) => i + 1).map(
                          (d) => (
                            <option key={d} value={d}>
                              Day {d} {d === activity.day ? "(目前所在)" : ""}
                            </option>
                          )
                        )}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                        <ICON_SVG.chevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                )}

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
                  {(() => {
                    const typeData =
                      ACTIVITY_TYPES.find(
                        (t) => t.id === (activity.type || "other")
                      ) || ACTIVITY_TYPES.find((t) => t.id === "other");
                    const Icon = ICON_SVG[typeData.icon];
                    return (
                      <div
                        className={`flex items-center text-[10px] font-bold mb-0.5 ${typeData.color}`}
                      >
                        <Icon className="w-3 h-3 mr-1" />
                        <span>{typeData.name}</span>
                      </div>
                    );
                  })()}

                  <h3
                    className={`text-base font-bold ${theme.cardTitle} truncate leading-snug mb-1`}
                  >
                    {activity.title}
                  </h3>

                  {(activity.startTime || activity.endTime) && (
                    <h4
                      className={`text-sm font-semibold ${theme.cardMetaLight} mb-1`}
                    >
                      {activity.startTime || "?"} ~ {activity.endTime || "?"}
                    </h4>
                  )}

                  {activity.location && (
                    <p
                      className={`flex items-center text-xs ${theme.cardMeta} mt-0.5`}
                    >
                      <ICON_SVG.mapPin
                        className={`w-3 h-3 mr-1 ${theme.accentText} flex-shrink-0`}
                      />
                      <span className="truncate">{activity.location}</span>
                    </p>
                  )}

                  {isExpanded && activity.description && (
                    <div
                      className={`mt-3 pt-2 border-t border-gray-100 text-sm ${theme.cardDesc} whitespace-pre-wrap animate-fade-in`}
                    >
                      {renderDescriptionWithLinks(activity.description)}
                    </div>
                  )}

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

                <div
                  className="flex flex-col space-y-2 flex-shrink-0 ml-2 pt-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex space-x-1 justify-end">
                    <button
                      onClick={() => onStartEdit(activity)}
                      className={`text-gray-400 hover:text-${theme.accent}-600 transition p-1`}
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
