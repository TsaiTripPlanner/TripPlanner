// src/App.js
import React, { useState } from "react";

// 常數與設定
import { DEFAULT_DAYS_OPTIONS } from "./utils/constants";
import {
  morandiBackground,
  morandiAccentColor,
  morandiButtonPrimary,
} from "./utils/theme";

// 組件
import Modal from "./components/Modal";
import ItineraryList from "./components/ItineraryList";
import TripDetails from "./components/TripDetails"; // ★ 引入新組件

// Hooks
import { useAuth } from "./hooks/useAuth";
import { useItineraries } from "./hooks/useItineraries";

const App = () => {
  // 1. 身分驗證
  const { userId, isAuthReady, authError: errorMessage } = useAuth();

  // 2. 行程列表管理 Hook
  const {
    allItineraries,
    isLoading: isItinerariesLoading,
    createItinerary: hookCreateItinerary,
    updateItinerary: hookUpdateItinerary,
    deleteItinerary: hookDeleteItinerary,
  } = useItineraries(userId);

  // 3. UI 狀態
  const [itineraryId, setItineraryId] = useState(null); // 目前選中的行程 ID

  // 建立行程相關
  const [isCreatingItinerary, setIsCreatingItinerary] = useState(false);
  const [newItineraryData, setNewItineraryData] = useState({
    title: "",
    days: 5,
    startDate: new Date().toISOString().split("T")[0],
  });

  // 編輯行程相關 (在列表頁修改基本資訊)
  const [isEditItineraryModalOpen, setIsEditItineraryModalOpen] =
    useState(false);
  const [editingItineraryData, setEditingItineraryData] = useState({
    id: null,
    title: "",
    days: 1,
    startDate: "",
  });

  // === 處理函式 ===

  const handleCreateItinerary = async () => {
    if (!newItineraryData.title.trim()) return;
    try {
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

  // 提供給詳細頁使用的標題更新功能
  const handleDetailTitleUpdate = async (id, newTitle) => {
    try {
      await hookUpdateItinerary(id, { title: newTitle });
    } catch (error) {
      console.error("更新標題失敗:", error);
      alert("更新標題失敗");
    }
  };

  const handleDeleteItinerary = async (id) => {
    if (!window.confirm("確定要永久刪除此行程及其所有資料嗎？")) return;
    try {
      await hookDeleteItinerary(id);
    } catch (e) {
      console.error("刪除行程失敗", e);
      alert("刪除失敗");
    }
  };

  // === 畫面渲染 ===

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

  // 取得目前選中的行程資料
  const currentItinerary = allItineraries.find((i) => i.id === itineraryId);

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
        <ItineraryList
          allItineraries={allItineraries}
          onSelect={(id) => setItineraryId(id)}
          onDelete={handleDeleteItinerary}
          onEdit={openEditItineraryModal}
          onOpenCreateModal={() => setIsCreatingItinerary(true)}
        />
      ) : // === 行程詳細頁面 (使用新組件) ===
      // 如果找不到該行程(可能剛被刪除)，就回到列表
      currentItinerary ? (
        <TripDetails
          userId={userId}
          itinerary={currentItinerary}
          allItineraries={allItineraries}
          onBack={() => setItineraryId(null)}
          onUpdateTitle={handleDetailTitleUpdate}
        />
      ) : (
        setItineraryId(null)
      )}

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
              className="block w-full max-w-full bg-white appearance-none box-border px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500"
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

      {/* 編輯行程 Modal (列表頁用) */}
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
              className="block w-full max-w-full bg-white appearance-none box-border px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500"
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
