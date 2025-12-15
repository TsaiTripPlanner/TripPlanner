import React, { useState, useEffect, useCallback, memo, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

// 原本的 Firebase 功能引入要留著 (除了 initializeApp 和 getFirestore)
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";

// 告訴 App.js 去 config 資料夾把設定拿來用
import { db, auth, appId } from "./config/firebase";

import { ICON_SVG } from "./utils/icons";

// 引入樣式 (把所有用到的樣式都從 theme 引入)
import {
  morandiBackground,
  morandiAccentColor,
  morandiButtonPrimary,
  morandiSelectedDayButton,
  morandiDayButtonPassive,
  morandiAccentText,
  morandiFloatingSelectedText,
  morandiFloatingPassiveText,
} from "./utils/theme";

// 引入剛剛拆出去的組件
import Modal from "./components/Modal";
import ItineraryCard from "./components/ItineraryCard";
import ActivityItem from "./components/ActivityItem";
import ListSection from "./components/ListSection";
import BudgetSection from "./components/BudgetSection";
import DayTabs from "./components/DayTabs";

import { useAuth } from "./hooks/useAuth";
import { useActivities } from "./hooks/useActivities";
import { useItineraries } from "./hooks/useItineraries";
import { usePackingList } from "./hooks/usePackingList";

const DEFAULT_DAYS_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10, 14, 30];

const App = () => {
  //  1. 【最優先】先確認使用者是誰 (從 useAuth 拿 userId)
  // authError: errorMessage 意思是把 hook 傳回來的 authError 改名叫 errorMessage
  const { userId, isAuthReady, authError: errorMessage } = useAuth();

  // 2. 【定義狀態】定義所有需要的變數 (itineraryId, activeDay)
  const [itineraryId, setItineraryId] = useState(null);
  const [activeTab, setActiveTab] = useState("itinerary");
  const [activeDay, setActiveDay] = useState(1);

  // === 呼叫行程管家 ===
  const {
    allItineraries,
    isLoading: isItinerariesLoading, // 改個別名以免跟 App 內原本的狀態衝突
    createItinerary: hookCreateItinerary, // 改個別名
    updateItinerary: hookUpdateItinerary, // 改個別名
    deleteItinerary: hookDeleteItinerary, // 改個別名
  } = useItineraries(userId);

  // === 呼叫清單管家 ===
  // 注意：newCategoryName 還是留在 App 這裡控制 UI，因為它是輸入框的狀態
  const {
    listCategories,
    addCategory: hookAddCategory,
    updateCategoryName,
    deleteCategory, // 直接用
    addItemToList, // 直接用
    updateItemName,
    toggleItemCompletion, // 直接用
    deleteItem, // 直接用
    importFromItinerary,
  } = usePackingList(userId, itineraryId);

  // === 呼叫活動管家 ===
  const {
    activities,
    addActivity: hookAddActivity, // 改個名避免衝突
    deleteActivity, // 直接覆蓋舊的函式名
    updateActivity,
    reorderActivities,
  } = useActivities(userId, itineraryId, activeDay);

  const [isCreatingItinerary, setIsCreatingItinerary] = useState(false);
  const [newItineraryData, setNewItineraryData] = useState({
    title: "",
    days: 5,
    startDate: new Date().toISOString().split("T")[0],
  });

  const [isEditItineraryModalOpen, setIsEditItineraryModalOpen] =
    useState(false);
  const [editingItineraryData, setEditingItineraryData] = useState({
    id: null,
    title: "",
    days: 1,
    startDate: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({
    title: "",
    location: "",
    startTime: "",
    endTime: "",
    description: "",
  });
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    location: "",
    startTime: "",
    endTime: "",
    description: "",
  });
  const [formError, setFormError] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  const currentItinerary = allItineraries.find((i) => i.id === itineraryId);
  const [currentTitle, setCurrentTitle] = useState("");
  const [totalDays, setTotalDays] = useState(6);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");

  useEffect(() => {
    if (currentItinerary) {
      setCurrentTitle(currentItinerary.title);
      setTotalDays(currentItinerary.durationDays || 6);
      setActiveDay(1);
    }
  }, [currentItinerary]);

  const handleCreateItinerary = async () => {
    // 改名為 handle... 以示區別
    if (!newItineraryData.title.trim()) return;
    try {
      // 呼叫管家幫忙建立
      await hookCreateItinerary({
        title: newItineraryData.title.trim(),
        days: newItineraryData.days,
        startDate: newItineraryData.startDate,
      });

      setIsCreatingItinerary(false);
      setNewItineraryData({
        title: "",
        days: 5,
        startDate: new Date().toISOString().split("T")[0],
      });
    } catch (e) {
      alert("建立失敗：" + e.message);
    }
  };

  const openEditItineraryModal = (itinerary) => {
    setEditingItineraryData({
      id: itinerary.id,
      title: itinerary.title,
      days: itinerary.durationDays,
      startDate: itinerary.startDate || "",
    });
    setIsEditItineraryModalOpen(true);
  };

  const handleUpdateItinerary = async () => {
    if (!editingItineraryData.title.trim() || !editingItineraryData.id) return;
    try {
      // 呼叫管家幫忙更新
      await hookUpdateItinerary(editingItineraryData.id, {
        title: editingItineraryData.title.trim(),
        durationDays: Number(editingItineraryData.days),
        startDate: editingItineraryData.startDate,
      });
      setIsEditItineraryModalOpen(false);
    } catch (error) {
      console.error("更新失敗:", error);
      alert("更新失敗: " + error.message);
    }
  };

  const handleDeleteItinerary = async (id) => {
    // 改名
    if (!window.confirm("確定要永久刪除此行程及其所有資料嗎？")) return;
    try {
      // 呼叫管家幫忙刪除
      await hookDeleteItinerary(id);
    } catch (e) {
      console.error("刪除行程失敗", e);
      alert("刪除失敗");
    }
  };

  const handleUpdateTitle = async () => {
    if (!itineraryId || !tempTitle.trim()) {
      setIsEditingTitle(false);
      return;
    }
    try {
      // 呼叫管家幫忙更新標題
      await hookUpdateItinerary(itineraryId, {
        title: tempTitle.trim(),
      });
      setIsEditingTitle(false);
    } catch (error) {
      console.error("更新標題失敗:", error);
      alert("更新標題失敗");
    }
  };

  const handleNewActivityChange = useCallback((e) => {
    setNewActivity((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError("");
  }, []);

  const handleAddActivity = useCallback(
    async (e) => {
      e.preventDefault();
      // 這裡使用了 Hook 傳回來的 hookAddActivity
      const { title, location, startTime, endTime, description } = newActivity;

      if (!title.trim() || !location.trim()) {
        setFormError("活動標題與地點為必填欄位！");
        return;
      }

      try {
        // ✅ 呼叫 Hook 提供的功能，只傳送資料就好
        await hookAddActivity({
          title,
          location,
          startTime: startTime || "",
          endTime: endTime || "",
          description: description || "",
        });

        // 清空表單
        setNewActivity({
          title: "",
          location: "",
          startTime: "",
          endTime: "",
          description: "",
        });
        setIsModalOpen(false);
      } catch (error) {
        setFormError(`錯誤：${error.message}`);
      }
    },
    [hookAddActivity, newActivity] // 依賴項變了
  );

  const handleEditInputChange = useCallback(
    (e) =>
      setEditFormData((prev) => ({ ...prev, [e.target.name]: e.target.value })),
    []
  );

  const startEditActivity = useCallback(
    (activity) => {
      if (editingActivityId === activity.id) {
        setEditingActivityId(null);
        setEditFormData({
          title: "",
          location: "",
          startTime: "",
          endTime: "",
          description: "",
        });
        return;
      }
      setEditingActivityId(activity.id);
      setEditFormData({
        title: activity.title,
        location: activity.location,
        startTime: activity.startTime || "",
        endTime: activity.endTime || "",
        description: activity.description,
      });
    },
    [editingActivityId]
  );

  const cancelEdit = useCallback(() => {
    setEditingActivityId(null);
    setEditFormData({
      title: "",
      location: "",
      startTime: "",
      endTime: "",
      description: "",
    });
  }, []);

  const saveEdit = useCallback(
    async (activityId) => {
      const { title, location, startTime, endTime, description } = editFormData;
      // ✅ 呼叫 Hook 的更新功能
      await updateActivity(activityId, {
        title,
        location,
        startTime,
        endTime,
        description: description || "",
      });
      cancelEdit();
    },
    [updateActivity, editFormData, cancelEdit]
  );

  const handleDragEnd = useCallback(
    (result) => {
      if (!result.destination) return;
      const { source, destination } = result;
      if (source.index === destination.index) return;

      const reorderedActivities = Array.from(activities);
      const [movedItem] = reorderedActivities.splice(source.index, 1);
      reorderedActivities.splice(destination.index, 0, movedItem);

      // ✅ 只要呼叫這一行，Hook 會幫你處理 State 更新和 Firebase 寫入
      reorderActivities(reorderedActivities);
    },
    [activities, reorderActivities]
  );

  const handleAddCategory = useCallback(async () => {
    if (!newCategoryName.trim()) return;
    try {
      // 呼叫管家，並把輸入框的字傳給它
      await hookAddCategory(newCategoryName);
      setNewCategoryName(""); // 清空輸入框
    } catch (error) {
      alert("新增類別失敗");
    }
  }, [hookAddCategory, newCategoryName]);

  if (isItinerariesLoading && !errorMessage)
    return (
      <div
        className={`flex items-center justify-center min-h-screen ${morandiBackground}`}
      >
        <div
          className={`animate-spin rounded-full h-12 w-12 border-b-2 border-${morandiAccentColor}-500`}
        ></div>
      </div>
    );

  return (
    <div
      className={`min-h-screen ${morandiBackground} p-4 sm:p-8 font-sans pb-28`}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Yuji+Syuku&family=Zen+Maru+Gothic:wght@500;700&display=swap');
        .font-serif-tc { font-family: 'Yuji Syuku', serif; letter-spacing: 0.05em; }
        .font-cute { font-family: 'Zen Maru Gothic', sans-serif; letter-spacing: 0.05em; }
      `}</style>

      {!itineraryId ? (
        // === 行程列表頁面 (首頁) ===
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
              onClick={() => setIsCreatingItinerary(true)}
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
                  onClick={() => setIsCreatingItinerary(true)}
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
                  onSelect={(id) => setItineraryId(id)}
                  onDelete={handleDeleteItinerary}
                  onEdit={openEditItineraryModal}
                />
              ))
            )}
          </div>
        </div>
      ) : (
        // === 行程詳細頁面 ===
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="flex items-center mb-4 sm:mb-0">
              <button
                onClick={() => setItineraryId(null)}
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
                      onClick={handleUpdateTitle}
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
                      {currentTitle}
                    </h1>
                    <button
                      onClick={() => {
                        setTempTitle(currentTitle);
                        setIsEditingTitle(true);
                      }}
                      className="text-gray-300 hover:text-slate-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ICON_SVG.pencil className="w-5 h-5" />
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1 ml-1">
                  共 {totalDays} 天
                </p>
              </div>
            </div>
          </div>

          {activeTab === "itinerary" && (
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <DayTabs
                totalDays={totalDays}
                activeDay={activeDay}
                setActiveDay={setActiveDay}
                startDate={currentItinerary?.startDate}
              />
              {/* 修改標題文字：把 "第 X 天" 改為 "Day X" */}
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
                                  className="mb-0"
                                  style={{ ...provided.draggableProps.style }}
                                >
                                  <ActivityItem
                                    activity={activity}
                                    index={index}
                                    onDelete={deleteActivity}
                                    onStartEdit={startEditActivity}
                                    isEditing={
                                      editingActivityId === activity.id
                                    }
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

          {activeTab === "packing" && (
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
              currentItineraryId={itineraryId}
            />
          )}

          {activeTab === "budget" && (
            <BudgetSection
              itineraryId={itineraryId}
              userId={userId}
              totalDays={totalDays}
              itineraryStartDate={currentItinerary?.startDate}
            />
          )}

          <div className="fixed inset-x-0 bottom-0 z-50 bg-white shadow-2xl pt-2 pb-safe border-t border-gray-200">
            <div className="max-w-4xl mx-auto px-4 flex justify-around sm:px-8 space-x-2">
              <div
                className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition duration-200 w-1/3 text-center justify-center ${
                  activeTab === "itinerary"
                    ? morandiFloatingSelectedText
                    : morandiFloatingPassiveText
                }`}
                onClick={() => setActiveTab("itinerary")}
              >
                <ICON_SVG.listCollapse className="w-6 h-6" />
                <span className="text-xs mt-1 font-medium">行程規劃</span>
              </div>
              <div
                className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition duration-200 w-1/3 text-center justify-center ${
                  activeTab === "packing"
                    ? morandiFloatingSelectedText
                    : morandiFloatingPassiveText
                }`}
                onClick={() => setActiveTab("packing")}
              >
                <ICON_SVG.clipboardCheck className="w-6 h-6" />
                <span className="text-xs mt-1 font-medium">清單</span>
              </div>
              <div
                className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition duration-200 w-1/3 text-center justify-center ${
                  activeTab === "budget"
                    ? morandiFloatingSelectedText
                    : morandiFloatingPassiveText
                }`}
                onClick={() => setActiveTab("budget")}
              >
                <ICON_SVG.wallet className="w-6 h-6" />
                <span className="text-xs mt-1 font-medium">旅行費用</span>
              </div>
            </div>
          </div>

          {activeTab === "itinerary" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className={`fixed right-6 bottom-32 sm:right-10 sm:bottom-32 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white ${morandiButtonPrimary} transition-all duration-300 transform hover:scale-105 z-40`}
            >
              <ICON_SVG.plusSmall className="w-8 h-8" />
            </button>
          )}
        </div>
      )}

      {/* 新增活動 Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormError("");
        }}
        title={`新增活動 (Day ${activeDay})`}
      >
        <form onSubmit={handleAddActivity} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              name="title"
              value={newActivity.title}
              onChange={handleNewActivityChange}
              placeholder="活動標題 *"
              className={`px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${morandiAccentColor}-500 focus:border-${morandiAccentColor}-500 text-sm`}
              required
            />
            <input
              type="text"
              name="location"
              value={newActivity.location}
              onChange={handleNewActivityChange}
              placeholder="地點 *"
              className={`px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${morandiAccentColor}-500 focus:border-${morandiAccentColor}-500 text-sm`}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="startTime"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                開始時間
              </label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={newActivity.startTime}
                onChange={handleNewActivityChange}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${morandiAccentColor}-500 focus:border-${morandiAccentColor}-500 text-sm`}
              />
            </div>
            <div>
              <label
                htmlFor="endTime"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                結束時間
              </label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={newActivity.endTime}
                onChange={handleNewActivityChange}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${morandiAccentColor}-500 focus:border-${morandiAccentColor}-500 text-sm`}
              />
            </div>
          </div>
          <textarea
            name="description"
            value={newActivity.description}
            onChange={handleNewActivityChange}
            rows="3"
            placeholder="詳細說明 (選填)"
            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${morandiAccentColor}-500 focus:border-${morandiAccentColor}-500 text-sm`}
          ></textarea>
          {formError && (
            <p className="text-sm text-red-500 font-medium">{formError}</p>
          )}
          <button
            type="submit"
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${morandiButtonPrimary} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition duration-150 ease-in-out`}
          >
            確認新增活動
          </button>
        </form>
      </Modal>

      {/* 建立新行程 Modal */}
      <Modal
        isOpen={isCreatingItinerary}
        onClose={() => setIsCreatingItinerary(false)}
        title="建立新旅程"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              旅程名稱
            </label>
            <input
              type="text"
              value={newItineraryData.title}
              onChange={(e) =>
                setNewItineraryData({
                  ...newItineraryData,
                  title: e.target.value,
                })
              }
              placeholder="例如：東京五日遊"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              出發日期
            </label>
            <input
              type="date"
              value={newItineraryData.startDate}
              onChange={(e) =>
                setNewItineraryData({
                  ...newItineraryData,
                  startDate: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              預計天數
            </label>
            <select
              value={newItineraryData.days}
              onChange={(e) =>
                setNewItineraryData({
                  ...newItineraryData,
                  days: parseInt(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500"
            >
              {DEFAULT_DAYS_OPTIONS.map((day) => (
                <option key={day} value={day}>
                  {day} 天
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleCreateItinerary}
            disabled={!newItineraryData.title.trim()}
            className={`w-full py-2 px-4 rounded-md text-white ${morandiButtonPrimary} disabled:opacity-50 mt-4`}
          >
            開始規劃
          </button>
        </div>
      </Modal>

      {/* 編輯行程 Modal */}
      <Modal
        isOpen={isEditItineraryModalOpen}
        onClose={() => setIsEditItineraryModalOpen(false)}
        title="修改旅程資訊"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              旅程名稱
            </label>
            <input
              type="text"
              value={editingItineraryData.title}
              onChange={(e) =>
                setEditingItineraryData({
                  ...editingItineraryData,
                  title: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              出發日期
            </label>
            <input
              type="date"
              value={editingItineraryData.startDate}
              onChange={(e) =>
                setEditingItineraryData({
                  ...editingItineraryData,
                  startDate: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              預計天數
            </label>
            <select
              value={editingItineraryData.days}
              onChange={(e) =>
                setEditingItineraryData({
                  ...editingItineraryData,
                  days: parseInt(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500"
            >
              {DEFAULT_DAYS_OPTIONS.map((day) => (
                <option key={day} value={day}>
                  {day} 天
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleUpdateItinerary}
            disabled={!editingItineraryData.title.trim()}
            className={`w-full py-2 px-4 rounded-md text-white ${morandiButtonPrimary} disabled:opacity-50 mt-4`}
          >
            儲存修改
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default App;
