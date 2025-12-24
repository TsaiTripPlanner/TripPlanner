// src/components/ActivityItem.js
import React, { memo, useState } from "react";
import { ICON_SVG } from "../utils/icons";
import { ACTIVITY_TYPES } from "../utils/constants";
import { useTheme } from "../utils/theme";
import { calculateDuration } from "../utils/dateUtils";

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

    // 計算持續時間
    const duration = calculateDuration(activity.startTime, activity.endTime);

    const typeData =
      ACTIVITY_TYPES.find((t) => t.id === (activity.type || "other")) ||
      ACTIVITY_TYPES.find((t) => t.id === "other");
    const isSightseeing = activity.type === "sightseeing";

    const customCardBg = isSightseeing
      ? "bg-sky-50/80 border-sky-200/70"
      : `${theme.cardBg} ${theme.cardBorder}`;

    const cardClasses = `rounded-lg p-3 transition-all cursor-pointer ${customCardBg} ${
      isEditing
        ? `shadow-md ring-2 ring-opacity-50 ${theme.accentRing} border-transparent cursor-default`
        : isDragging
        ? `shadow-2xl ring-2 ${theme.accentRingLight} rotate-1 border-transparent z-50`
        : `border shadow-sm ${theme.accentBorderHover}`
    }`;

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
          className={`mt-1 h-9 block w-full min-w-0 max-w-full bg-white appearance-none px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm ${theme.ringFocus} ${theme.borderFocus}`}
          required={name === "title"}
        />
      </div>
    );

    return (
      <div className="flex relative h-full">
        <div className="w-14 sm:w-20 text-right flex-shrink-0 pr-1 sm:pr-4 pt-0.5 block pb-8">
          <div
            className={`text-sm sm:text-lg font-bold ${theme.accentText} leading-snug`}
          >
            {timeDisplay}
          </div>
          {duration && (
            <div
              className={`text-[9px] sm:text-xs ${theme.cardMeta} mt-0.5 font-medium whitespace-nowrap`}
            >
              ({duration})
            </div>
          )}
        </div>

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
                : isSightseeing
                ? "bg-sky-400"
                : theme.timelineDotPassive
            } flex-shrink-0 mt-1`}
          ></div>
        </div>

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
              <div onClick={(e) => e.stopPropagation()}>
                <h4 className={`text-lg font-bold mb-3 ${theme.accentText}`}>
                  編輯活動
                </h4>
                {/* 類別選擇 */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {ACTIVITY_TYPES.map((type) => {
                      const Icon = ICON_SVG[type.icon];
                      const isSelected = (editData.type || "other") === type.id;
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
                              : "bg-white border-gray-200 text-gray-500"
                          }`}
                        >
                          <Icon className="w-3 h-3 mr-1" /> {type.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {/* 輸入框群組 */}
                {inputField("title", "標題")}
                {inputField("location", "地點")}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {inputField("startTime", "開始時間", "time")}
                  {inputField("endTime", "結束時間", "time")}
                </div>
                <div className="mb-3">
                  <textarea
                    name="description"
                    value={editData.description || ""}
                    onChange={onEditChange}
                    rows="3"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                    placeholder="詳細說明"
                  ></textarea>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={onCancelEdit}
                    type="button"
                    className="text-gray-600 bg-gray-200 px-3 py-1 rounded-md text-sm"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => onSaveEdit(activity.id)}
                    type="button"
                    className="text-white bg-slate-600 px-3 py-1 rounded-md text-sm"
                  >
                    儲存
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start">
                <div className="flex-grow min-w-0">
                  <div
                    className={`flex items-center text-[10px] font-bold mb-0.5 ${typeData.color}`}
                  >
                    {(() => {
                      const Icon = ICON_SVG[typeData.icon];
                      return <Icon className="w-3 h-3 mr-1" />;
                    })()}
                    <span>{typeData.name}</span>
                  </div>
                  <h3
                    className={`text-base font-bold ${theme.cardTitle} truncate leading-snug mb-1`}
                  >
                    {activity.title}
                  </h3>
                  {activity.location && (
                    <p
                      className={`flex items-center text-xs ${theme.cardMeta} mt-0.5`}
                    >
                      <ICON_SVG.mapPin className="w-3 h-3 mr-1 text-slate-400" />
                      <span className="truncate">{activity.location}</span>
                    </p>
                  )}
                  {isExpanded && activity.description && (
                    <div className="mt-3 pt-2 border-t border-gray-100 text-sm whitespace-pre-wrap">
                      {renderDescriptionWithLinks(activity.description)}
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
                      className="text-gray-400 hover:text-slate-600"
                    >
                      <ICON_SVG.pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDelete(activity.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <ICON_SVG.trash className="w-5 h-5" />
                    </button>
                  </div>
                  <div
                    {...dragHandleProps}
                    className="flex items-center justify-center p-2 text-gray-300 hover:text-gray-500 cursor-grab"
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
