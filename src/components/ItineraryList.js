import React from "react";
// 引入圖示
import { ICON_SVG } from "../utils/icons";
// 引入樣式變數
import { morandiButtonPrimary } from "../utils/theme";
// 引入原本就在用的卡片元件
import ItineraryCard from "./ItineraryCard";

// 這裡我們定義一個新元件，它需要接收父層(App.js)傳下來的資料
// allItineraries: 所有行程資料
// onSelect: 當使用者點擊卡片時要做的事
// onDelete: 當使用者刪除時要做的事
// onEdit: 當使用者編輯時要做的事
// onOpenCreateModal: 當使用者想按「建立新旅程」按鈕時要做的事
const ItineraryList = ({
  allItineraries,
  onSelect,
  onDelete,
  onEdit,
  onOpenCreateModal,
}) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-medium text-gray-800 font-cute flex items-center">
          <img
            src="/world_761505.jpg"
            alt="Logo"
            className="w-12 h-12 object-contain mr-3"
          />
          旅遊
        </h1>
        <button
          onClick={onOpenCreateModal} // 使用傳進來的函式
          className={`flex items-center px-4 py-2 rounded-lg text-white shadow-md ${morandiButtonPrimary} transition transform hover:scale-105`}
        >
          <ICON_SVG.plusSmall className="w-5 h-5 mr-1" /> 建立新旅程
        </button>
      </div>

      <div className="flex flex-col space-y-4">
        {allItineraries.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
            <p className="text-gray-500 mb-4">目前還沒有任何行程規劃</p>
            <button
              onClick={onOpenCreateModal} // 使用傳進來的函式
              className="text-slate-600 font-medium hover:underline"
            >
              立即建立第一個旅程
            </button>
          </div>
        ) : (
          allItineraries.map((trip) => (
            <ItineraryCard
              key={trip.id}
              data={trip}
              onSelect={onSelect}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ItineraryList;
