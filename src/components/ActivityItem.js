// src/components/ActivityItem.js
import React, { memo, useState } from "react";
import { ICON_SVG } from "../utils/icons";
import { ACTIVITY_TYPES } from "../utils/constants";
import { useTheme } from "../utils/theme";
import { calculateDuration } from "../utils/dateUtils";
import ImageUpload from "./ImageUpload";

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
  }) => {
    const { theme } = useTheme();
    const [isExpanded, setIsExpanded] = useState(false);

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

    const inputClasses = `mt-1 h-9 block w-full bg-white px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm ${theme.ringFocus} ${theme.borderFocus}`;

    return (
      <div className="flex relative h-full">
        {/* 左側時間軸 - 維持顯示 "未定" */}
        <div className="w-14 sm:w-20 text-right flex-shrink-0 pr-1 sm:pr-4 pt-0.5 block pb-8">
          <div
            className={`text-sm sm:text-lg font-bold ${theme.accentText} leading-snug`}
          >
            {activity.startTime || "未定"}
          </div>
          {duration && (
            <div
              className={`text-[9px] sm:text-xs ${theme.cardMeta} mt-0.5 font-medium whitespace-nowrap`}
            >
              ({duration})
            </div>
          )}
        </div>

        {/* 中間線條 */}
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
              isSightseeing ? "bg-sky-400" : theme.timelineDotPassive
            } mt-1`}
          ></div>
        </div>

        {/* 右側卡片 */}
        <div className={`flex-grow min-w-0 pb-8 sm:ml-4`}>
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

                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-500">
                    標題
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={editData.title || ""}
                    onChange={onEditChange}
                    className={inputClasses}
                  />
                </div>

                {/* 修正手機版欄位重疊問題 */}
                <div className="flex gap-2 w-full mb-3">
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-medium text-gray-500 truncate">
                      開始時間
                    </label>
                    <input
                      type="time"
                      name="startTime"
                      value={editData.startTime || ""}
                      onChange={onEditChange}
                      className={`h-10 block w-full bg-white appearance-none px-1 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none ${theme.ringFocus} ${theme.borderFocus} text-sm text-center`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-medium text-gray-500 truncate">
                      結束時間
                    </label>
                    <input
                      type="time"
                      name="endTime"
                      value={editData.endTime || ""}
                      onChange={onEditChange}
                      className={`h-10 block w-full bg-white appearance-none px-1 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none ${theme.ringFocus} ${theme.borderFocus} text-sm text-center`}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    修改照片/憑證 (選填)
                  </label>
                  <ImageUpload
                    currentImage={editData.imageUrl}
                    onUploadSuccess={(url) =>
                      onEditChange({ target: { name: "imageUrl", value: url } })
                    }
                  />
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-500">
                    詳細說明
                  </label>
                  <textarea
                    name="description"
                    value={editData.description || ""}
                    onChange={onEditChange}
                    rows="3"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                    placeholder="詳細說明或網址"
                  ></textarea>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={onCancelEdit}
                    className="text-gray-600 bg-gray-200 px-3 py-1 rounded-md text-sm"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => onSaveEdit(activity.id)}
                    className="text-white bg-slate-600 px-3 py-1 rounded-md text-sm"
                  >
                    儲存
                  </button>
                </div>
              </div>
            ) : (
              // === 顯示模式 ===
              <div className="flex justify-between items-start">
                <div className="flex-grow min-w-0">
                  <div
                    className={`flex items-center text-[10px] font-bold mb-1 ${typeData.color}`}
                  >
                    {(() => {
                      const Icon = ICON_SVG[typeData.icon];
                      return <Icon className="w-3 h-3 mr-1" />;
                    })()}
                    <span>{typeData.name}</span>
                  </div>

                  <h3
                    className={`text-base font-bold ${theme.cardTitle} truncate leading-snug`}
                  >
                    {activity.title}
                  </h3>

                  {/* 時間區間：直接顯示時間，不顯示中文 */}
                  <div
                    className={`text-[11px] font-medium ${theme.cardMeta} mt-0.5 mb-1`}
                  >
                    {activity.startTime || "?"} - {activity.endTime || "?"}
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-2 border-t border-gray-100 animate-fade-in">
                      {activity.imageUrl && (
                        <div className="mb-3 rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={activity.imageUrl}
                            alt="活動照片"
                            className="w-full h-auto max-h-60 object-cover"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(activity.imageUrl);
                            }}
                          />
                        </div>
                      )}
                      {activity.description && (
                        <div
                          className={`text-sm ${theme.cardDesc} whitespace-pre-wrap`}
                        >
                          {renderDescriptionWithLinks(activity.description)}
                        </div>
                      )}
                    </div>
                  )}

                  {(activity.description || activity.imageUrl) && (
                    <div className="mt-1 text-center">
                      {isExpanded ? (
                        <ICON_SVG.chevronUp className="w-4 h-4 text-gray-300 mx-auto" />
                      ) : (
                        <ICON_SVG.chevronDown className="w-4 h-4 text-gray-300 mx-auto" />
                      )}
                    </div>
                  )}
                </div>

                {/* 按鈕區 */}
                <div
                  className="flex flex-col space-y-2 flex-shrink-0 ml-2 pt-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex space-x-1 justify-end">
                    <button
                      onClick={() => onStartEdit(activity)}
                      className="text-gray-300 hover:text-slate-600 p-1"
                    >
                      <ICON_SVG.pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDelete(activity.id)}
                      className="text-gray-300 hover:text-red-500 p-1"
                    >
                      <ICON_SVG.trash className="w-5 h-5" />
                    </button>
                  </div>
                  <div
                    {...dragHandleProps}
                    className="flex items-center justify-center p-2 text-gray-300 cursor-grab"
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
