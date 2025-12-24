// src/components/TripDetails.js
import React, { useState, useCallback } from "react";
import { TABS } from "../utils/constants";
import { ICON_SVG } from "../utils/icons";
import { useTheme } from "../utils/theme";

// 引入組件
import ItineraryTab from "./ItineraryTab";
import ListSection from "./ListSection";
import BudgetSection from "./BudgetSection";
import ReferenceSection from "./ReferenceSection"; // 新增

// 引入 Hooks
import { usePackingList } from "../hooks/usePackingList";
import { useReferences } from "../hooks/useReferences"; // 新增

const TripDetails = ({
  userId,
  itinerary,
  onBack,
  onUpdateTitle,
  allItineraries,
}) => {
  const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState(TABS.ITINERARY);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(itinerary.title);

  // 1. 所有 Hooks 必須放在組件頂部
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
  } = usePackingList(
    userId,
    itinerary.id,
    activeTab === TABS.PACKING // 只有在分頁是「清單」時，開關才會是 true
  );

  const { references, addReference, updateReference, deleteReference } =
    useReferences(
      userId,
      itinerary.id,
      activeTab === TABS.REFERENCE // 只有在分頁是「參考資料」時，開關才會是 true
    );

  const [newCategoryName, setNewCategoryName] = useState("");

  const handleAddCategory = useCallback(async () => {
    if (!newCategoryName.trim()) return;
    await addCategory(newCategoryName);
    setNewCategoryName("");
  }, [addCategory, newCategoryName]);

  const handleTitleSave = () => {
    if (tempTitle.trim()) {
      onUpdateTitle(itinerary.id, tempTitle.trim());
      setIsEditingTitle(false);
    }
  };

  // 2. 只有一個 return 區塊
  return (
    <div className="max-w-4xl mx-auto">
      {/* 頂部標題與返回按鈕 */}
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
                  className={`text-2xl sm:text-3xl font-normal border-b-2 ${theme.accentBorder} focus:outline-none w-full bg-transparent`}
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

      {/* 內容區域：根據 activeTab 顯示不同組件 */}
      <div className="pb-20">
        {activeTab === TABS.ITINERARY && (
          <ItineraryTab userId={userId} itinerary={itinerary} />
        )}

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

        {activeTab === TABS.BUDGET && (
          <BudgetSection
            itineraryId={itinerary.id}
            userId={userId}
            totalDays={itinerary.durationDays}
            itineraryStartDate={itinerary.startDate}
            travelerCount={itinerary.travelerCount || 1}
          />
        )}

        {activeTab === TABS.REFERENCE && (
          <ReferenceSection
            references={references}
            onAdd={addReference}
            onUpdate={updateReference}
            onDelete={deleteReference}
          />
        )}
      </div>

      {/* 底部導覽列：現在改為 4 個按鈕 */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white shadow-2xl pt-2 pb-safe border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 flex justify-around sm:px-8 space-x-1">
          {/* 行程規劃 */}
          <div
            className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition duration-200 w-1/4 text-center justify-center ${
              activeTab === TABS.ITINERARY
                ? theme.floatingSelectedText
                : theme.floatingPassiveText
            }`}
            onClick={() => setActiveTab(TABS.ITINERARY)}
          >
            <ICON_SVG.listCollapse className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-medium">行程規劃</span>
          </div>

          {/* 清單 */}
          <div
            className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition duration-200 w-1/4 text-center justify-center ${
              activeTab === TABS.PACKING
                ? theme.floatingSelectedText
                : theme.floatingPassiveText
            }`}
            onClick={() => setActiveTab(TABS.PACKING)}
          >
            <ICON_SVG.clipboardCheck className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-medium">清單</span>
          </div>

          {/* 旅行費用 */}
          <div
            className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition duration-200 w-1/4 text-center justify-center ${
              activeTab === TABS.BUDGET
                ? theme.floatingSelectedText
                : theme.floatingPassiveText
            }`}
            onClick={() => setActiveTab(TABS.BUDGET)}
          >
            <ICON_SVG.wallet className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-medium">旅行費用</span>
          </div>

          {/* 參考資料 (新增) */}
          <div
            className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition duration-200 w-1/4 text-center justify-center ${
              activeTab === TABS.REFERENCE
                ? theme.floatingSelectedText
                : theme.floatingPassiveText
            }`}
            onClick={() => setActiveTab(TABS.REFERENCE)}
          >
            <ICON_SVG.paperClip className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-medium">參考資料</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripDetails;
