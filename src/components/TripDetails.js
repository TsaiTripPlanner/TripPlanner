// src/components/TripDetails.js
import React, { useState, useCallback } from "react";
import { TABS } from "../utils/constants";
import { ICON_SVG } from "../utils/icons";
import { useTheme } from "../utils/theme";

// 引入三個主要的分頁組件
import ItineraryTab from "./ItineraryTab"; // ★ 這是我們剛剛新增的
import ListSection from "./ListSection";
import BudgetSection from "./BudgetSection";

// Hooks (只保留 ListSection 需要的，行程的 Hook 已經搬去 ItineraryTab 了)
import { usePackingList } from "../hooks/usePackingList";

const TripDetails = ({
  userId,
  itinerary,
  onBack,
  onUpdateTitle,
  allItineraries,
}) => {
  const { theme } = useTheme();

  // 狀態：目前選中的分頁 (預設是行程)
  const [activeTab, setActiveTab] = useState(TABS.ITINERARY);

  // 狀態：標題編輯
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(itinerary.title);

  // --- ListSection 相關邏輯 (這裡暫時保留在最上層，沒關係) ---
  const {
    listCategories,
    addCategory,
    updateCategoryName,
    deleteCategory,
    addItemToList,
    updateItemName,
    toggleItemCompletion,
    deleteItem,
    importFromItinerary,
  } = usePackingList(userId, itinerary.id);

  const [newCategoryName, setNewCategoryName] = useState("");

  const handleAddCategory = useCallback(async () => {
    if (!newCategoryName.trim()) return;
    await addCategory(newCategoryName);
    setNewCategoryName("");
  }, [addCategory, newCategoryName]);

  // --- 標題更新邏輯 ---
  const handleTitleSave = () => {
    if (tempTitle.trim()) {
      onUpdateTitle(itinerary.id, tempTitle.trim());
      setIsEditingTitle(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* 1. 頂部導航列 (返回按鈕 + 標題) */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between">
        <div className="flex items-center mb-4 sm:mb-0">
          <button
            onClick={onBack}
            className="mr-3 p-2 rounded-full hover:bg-gray-200 transition text-gray-600"
            title="返回行程列表"
          >
            <ICON_SVG.arrowLeft className="w-6 h-6" />
          </button>

          <div className="flex-grow">
            {isEditingTitle ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="text-2xl sm:text-3xl font-normal border-b-2 border-slate-500 focus:outline-none w-full bg-transparent"
                  autoFocus
                />
                <button
                  onClick={handleTitleSave}
                  className="text-green-600 hover:text-green-800 p-2"
                >
                  <ICON_SVG.check className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setIsEditingTitle(false)}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <ICON_SVG.xMark className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 group">
                <h1 className="text-3xl sm:text-4xl font-normal tracking-tight break-words leading-tight max-w-xs sm:max-w-xl">
                  {itinerary.title}
                </h1>
                <button
                  onClick={() => {
                    setTempTitle(itinerary.title);
                    setIsEditingTitle(true);
                  }}
                  className="text-gray-300 hover:text-slate-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ICON_SVG.pencil className="w-5 h-5" />
                </button>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1 ml-1">
              共 {itinerary.durationDays} 天
            </p>
          </div>
        </div>
      </div>

      {/* 2. 內容顯示區 (根據 activeTab 顯示不同組件) */}

      {/* ★ 如果是行程分頁，就顯示新的 ItineraryTab */}
      {activeTab === TABS.ITINERARY && (
        <ItineraryTab userId={userId} itinerary={itinerary} />
      )}

      {/* ★ 如果是清單分頁 */}
      {activeTab === TABS.PACKING && (
        <ListSection
          listCategories={listCategories}
          newCategoryName={newCategoryName}
          setNewCategoryName={setNewCategoryName}
          addCategory={handleAddCategory}
          deleteCategory={deleteCategory}
          addItemToList={addItemToList}
          toggleItemCompletion={toggleItemCompletion}
          deleteItem={deleteItem}
          updateCategoryName={updateCategoryName}
          updateItemName={updateItemName}
          importFromItinerary={importFromItinerary}
          allItineraries={allItineraries}
          currentItineraryId={itinerary.id}
        />
      )}

      {/* ★ 如果是預算分頁 */}
      {activeTab === TABS.BUDGET && (
        <BudgetSection
          itineraryId={itinerary.id}
          userId={userId}
          totalDays={itinerary.durationDays}
          itineraryStartDate={itinerary.startDate}
        />
      )}

      {/* 3. 底部懸浮切換按鈕 (Footer Menu) */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white shadow-2xl pt-2 pb-safe border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 flex justify-around sm:px-8 space-x-2">
          <div
            className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition duration-200 w-1/3 text-center justify-center ${
              activeTab === TABS.ITINERARY
                ? theme.floatingSelectedText
                : theme.floatingPassiveText
            }`}
            onClick={() => setActiveTab(TABS.ITINERARY)}
          >
            <ICON_SVG.listCollapse className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">行程規劃</span>
          </div>
          <div
            className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition duration-200 w-1/3 text-center justify-center ${
              activeTab === TABS.PACKING
                ? theme.floatingSelectedText
                : theme.floatingPassiveText
            }`}
            onClick={() => setActiveTab(TABS.PACKING)}
          >
            <ICON_SVG.clipboardCheck className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">清單</span>
          </div>
          <div
            className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition duration-200 w-1/3 text-center justify-center ${
              activeTab === TABS.BUDGET
                ? theme.floatingSelectedText
                : theme.floatingPassiveText
            }`}
            onClick={() => setActiveTab(TABS.BUDGET)}
          >
            <ICON_SVG.wallet className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">旅行費用</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripDetails;
