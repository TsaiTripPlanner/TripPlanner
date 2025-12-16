// src/components/TripDetails.js
import React, { useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import { TABS } from "../utils/constants";
import { ICON_SVG } from "../utils/icons";
import {
  morandiButtonPrimary,
  morandiFloatingSelectedText,
  morandiFloatingPassiveText,
} from "../utils/theme";

import Modal from "./Modal";
import ActivityItem from "./ActivityItem";
import ListSection from "./ListSection";
import BudgetSection from "./BudgetSection";
import DayTabs from "./DayTabs";
import ActivityForm from "./ActivityForm"; // ★ 1. 引入新組件

import { useActivities } from "../hooks/useActivities";
import { usePackingList } from "../hooks/usePackingList";

const TripDetails = ({
  userId,
  itinerary,
  onBack,
  onUpdateTitle,
  allItineraries,
}) => {
  const [activeTab, setActiveTab] = useState(TABS.ITINERARY);
  const [activeDay, setActiveDay] = useState(1);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(itinerary.title);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // === Hooks ===
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

  const {
    activities,
    addActivity: hookAddActivity,
    deleteActivity,
    updateActivity,
    reorderActivities,
  } = useActivities(userId, itinerary.id, activeDay);

  // === 狀態 (已經移除了 newActivity 和 formError 相關狀態) ===
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [newCategoryName, setNewCategoryName] = useState("");

  // === 處理函式 ===

  const handleTitleSave = () => {
    if (tempTitle.trim()) {
      onUpdateTitle(itinerary.id, tempTitle.trim());
      setIsEditingTitle(false);
    }
  };

  // ★ 2. 簡化後的 handleAddActivity
  // 現在它只負責接收資料，並呼叫 Hook
  const handleAddActivity = async (activityData) => {
    try {
      await hookAddActivity(activityData);
      setIsModalOpen(false); // 成功後關閉 Modal
    } catch (error) {
      alert("新增失敗: " + error.message);
    }
  };

  const handleDragEnd = useCallback(
    (result) => {
      if (!result.destination) return;
      const { source, destination } = result;
      if (source.index === destination.index) return;
      const reorderedActivities = Array.from(activities);
      const [movedItem] = reorderedActivities.splice(source.index, 1);
      reorderedActivities.splice(destination.index, 0, movedItem);
      reorderActivities(reorderedActivities);
    },
    [activities, reorderActivities]
  );

  const startEditActivity = useCallback((activity) => {
    setEditingActivityId(activity.id);
    setEditFormData({ ...activity });
  }, []);

  const handleEditInputChange = useCallback((e) => {
    setEditFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const saveEdit = useCallback(
    async (activityId) => {
      await updateActivity(activityId, editFormData);
      setEditingActivityId(null);
    },
    [updateActivity, editFormData]
  );

  const cancelEdit = useCallback(() => {
    setEditingActivityId(null);
    setEditFormData({});
  }, []);

  const handleAddCategory = useCallback(async () => {
    if (!newCategoryName.trim()) return;
    await addCategory(newCategoryName);
    setNewCategoryName("");
  }, [addCategory, newCategoryName]);

  return (
    <div className="max-w-4xl mx-auto">
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
                  className="text-2xl sm:text-3xl font-normal text-gray-800 border-b-2 border-slate-500 focus:outline-none w-full bg-transparent font-cute"
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
                <h1 className="text-3xl sm:text-4xl font-normal text-gray-800 tracking-tight font-cute break-words leading-tight max-w-xs sm:max-w-xl">
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

      {activeTab === TABS.ITINERARY && (
        <div className="bg-white p-2 sm:p-6 rounded-xl shadow-lg">
          <DayTabs
            totalDays={itinerary.durationDays}
            activeDay={activeDay}
            setActiveDay={setActiveDay}
            startDate={itinerary.startDate}
          />
          <h3 className="text-2xl font-semibold text-gray-800 mb-6 font-cute">
            Day {activeDay}{" "}
            <span className="text-base text-gray-400 font-normal ml-2">
              的活動
            </span>
          </h3>

          <div className="relative mb-10">
            {activities.length > 0 ? (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="activities-list">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className=""
                    >
                      {activities.map((activity, index) => (
                        <Draggable
                          key={activity.id}
                          draggableId={activity.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              style={{ ...provided.draggableProps.style }}
                            >
                              <ActivityItem
                                activity={activity}
                                index={index}
                                onDelete={deleteActivity}
                                onStartEdit={startEditActivity}
                                isEditing={editingActivityId === activity.id}
                                editData={editFormData}
                                onEditChange={handleEditInputChange}
                                onSaveEdit={saveEdit}
                                onCancelEdit={cancelEdit}
                                dragHandleProps={provided.dragHandleProps}
                                isDragging={snapshot.isDragging}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg text-gray-500">
                <p className="font-medium">這一天目前還沒有安排活動。</p>
                <p className="text-sm">請點擊右下角的 + 按鈕新增活動！</p>
              </div>
            )}
          </div>
        </div>
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
        />
      )}

      <div className="fixed inset-x-0 bottom-0 z-50 bg-white shadow-2xl pt-2 pb-safe border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 flex justify-around sm:px-8 space-x-2">
          <div
            className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition duration-200 w-1/3 text-center justify-center ${
              activeTab === TABS.ITINERARY
                ? morandiFloatingSelectedText
                : morandiFloatingPassiveText
            }`}
            onClick={() => setActiveTab(TABS.ITINERARY)}
          >
            <ICON_SVG.listCollapse className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">行程規劃</span>
          </div>
          <div
            className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition duration-200 w-1/3 text-center justify-center ${
              activeTab === TABS.PACKING
                ? morandiFloatingSelectedText
                : morandiFloatingPassiveText
            }`}
            onClick={() => setActiveTab(TABS.PACKING)}
          >
            <ICON_SVG.clipboardCheck className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">清單</span>
          </div>
          <div
            className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition duration-200 w-1/3 text-center justify-center ${
              activeTab === TABS.BUDGET
                ? morandiFloatingSelectedText
                : morandiFloatingPassiveText
            }`}
            onClick={() => setActiveTab(TABS.BUDGET)}
          >
            <ICON_SVG.wallet className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">旅行費用</span>
          </div>
        </div>
      </div>

      {activeTab === TABS.ITINERARY && (
        <button
          onClick={() => setIsModalOpen(true)}
          className={`fixed right-6 bottom-32 sm:right-10 sm:bottom-32 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white ${morandiButtonPrimary} transition-all duration-300 transform hover:scale-105 z-40`}
        >
          <ICON_SVG.plusSmall className="w-8 h-8" />
        </button>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`新增活動 (Day ${activeDay})`}
      >
        {/* ★ 3. 這裡只要放一行，乾淨俐落！ */}
        <ActivityForm onSubmit={handleAddActivity} />
      </Modal>
    </div>
  );
};

export default TripDetails;
