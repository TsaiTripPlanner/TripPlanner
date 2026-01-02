// src/components/ItineraryCard.js
import React from "react";
import { ICON_SVG } from "../utils/icons";

const ItineraryCard = ({ data, onSelect, onDelete, onEdit }) => {
  let displayDate = "";
  if (data.startDate) {
    displayDate = data.startDate.replace(/-/g, "/");
  } else {
    displayDate = new Date(data.createdAt?.seconds * 1000).toLocaleDateString();
  }

  return (
    <div
      onClick={() => onSelect(data.id)}
      className="bg-white p-5 rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-100 group relative flex items-center justify-between"
    >
      <div className="flex-grow pr-4">
        {/* ★ 修改重點：拿掉了 text-gray-800 和 font-cute */}
        <h3 className={`text-xl mb-2 group-hover:opacity-75 transition break-words leading-relaxed ${currentThemeId === 'muji' ? 'muji-title-bold' : 'font-bold'}`}>
          {data.title}
        </h3>
        <p className="text-sm text-gray-500 flex items-center">
          <ICON_SVG.calendar className="w-4 h-4 mr-1 text-slate-400" />
          <span className="font-medium mr-1">{data.durationDays} 天</span>
          <span className="mx-2 text-gray-300">|</span>
          <span className="text-slate-500 font-medium">
            {displayDate}{" "}
            <span className="text-xs text-gray-400 font-normal">出發</span>
          </span>
        </p>
      </div>
      <div className="flex-shrink-0 flex items-center space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(data);
          }}
          className="text-gray-300 hover:text-blue-500 p-2 rounded-full hover:bg-blue-50 transition"
          title="修改行程"
        >
          <ICON_SVG.pencil className="w-5 h-5" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(data.id);
          }}
          className="text-gray-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition"
          title="刪除行程"
        >
          <ICON_SVG.trash className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
export default ItineraryCard;
