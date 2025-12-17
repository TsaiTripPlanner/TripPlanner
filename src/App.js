// src/App.js
import React, { useState } from "react";

// 常數與設定
import { DEFAULT_DAYS_OPTIONS } from "./utils/constants";
import {
  morandiBackground,
  morandiAccentColor,
  morandiButtonPrimary,
} from "./utils/theme";
import { ICON_SVG } from "./utils/icons"; // 記得引入 Icon

// 組件
import Modal from "./components/Modal";
import ItineraryList from "./components/ItineraryList";
import TripDetails from "./components/TripDetails";

// Hooks
import { useAuth } from "./hooks/useAuth";
import { useItineraries } from "./hooks/useItineraries";

const App = () => {
  // 1. 身分驗證 (引入新的 loginWithCode, logout, userCode)
  const {
    userId,
    isAuthReady,
    authError: errorMessage,
    loginWithCode, // ★ 新功能：用通行碼登入
    logout, // ★ 新功能：登出
    isAnonymous, // ★ 新功能：判斷是否為訪客
    userCode, // ★ 新功能：顯示目前的通行碼
  } = useAuth();

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

  // 登入 Modal 狀態
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState("");

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

  // ★ 處理通行碼登入
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!accessCodeInput.trim()) return;

    try {
      await loginWithCode(accessCodeInput.trim());
      alert(`歡迎！已進入「${accessCodeInput}」的行程空間。`);
      setIsLoginModalOpen(false);
      setAccessCodeInput("");
    } catch (error) {
      alert(error.message);
    }
  };

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
      className={`min-h-screen ${morandiBackground} p-4 sm:p-8 font-sans pb-28 relative`}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Yuji+Syuku&family=Zen+Maru+Gothic:wght@500;700&display=swap');
        .font-serif-tc { font-family: 'Yuji Syuku', serif; letter-spacing: 0.05em; }
        .font-cute { font-family: 'Zen Maru Gothic', sans-serif; letter-spacing: 0.05em; }
      `}</style>

      {/* ★★★ 右上角登入/登出按鈕區塊 ★★★ */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end">
        {isAnonymous ? (
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="flex items-center gap-2 bg-white/80 backdrop-blur border border-slate-200 shadow-sm px-4 py-2 rounded-full text-slate-600 hover:bg-white hover:shadow-md transition text-sm font-medium"
          >
            <ICON_SVG.check className="w-4 h-4 text-slate-400" />
            登入 / 綁定通行碼
          </button>
        ) : (
          <div className="flex items-center gap-3 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-sm border border-green-100">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                Access Code
              </span>
              <span className="text-sm font-bold text-green-700 font-mono">
                {userCode}
              </span>
            </div>
            <div className="h-6 w-px bg-gray-200"></div>
            <button
              onClick={logout}
              className="text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 px-2 py-1 rounded transition"
            >
              登出
            </button>
          </div>
        )}
      </div>

      {!itineraryId ? (
        // === 行程列表頁面 (首頁) ===
        <ItineraryList
          allItineraries={allItineraries}
          onSelect={(id) => setItineraryId(id)}
          onDelete={handleDeleteItinerary}
          onEdit={openEditItineraryModal}
          onOpenCreateModal={() => setIsCreatingItinerary(true)}
        />
      ) : // === 行程詳細頁面 ===
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

      {/* ★★★ 通行碼登入 Modal ★★★ */}
      <Modal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        title="輸入行程通行碼"
      >
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-4">
            <p className="font-bold flex items-center mb-1">
              <ICON_SVG.listCollapse className="w-4 h-4 mr-1" />
              通行碼機制說明
            </p>
            <ul className="list-disc list-inside mt-1 space-y-1 text-xs opacity-90">
              <li>這是一個讓朋友快速加入的代號。</li>
              <li>
                若輸入<span className="font-bold">新的代號</span>
                ，將會建立一個新的空白行程空間。
              </li>
              <li>
                若輸入<span className="font-bold">現有的代號</span>
                ，將會進入該空間並同步看到資料。
              </li>
              <li>請將代號分享給旅伴，大家就能一起規劃！</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              設定或輸入通行碼
            </label>
            <input
              type="text"
              required
              placeholder="例如：Tokyo2025"
              value={accessCodeInput}
              onChange={(e) => setAccessCodeInput(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-slate-500 focus:border-slate-500 text-lg tracking-wide text-center"
            />
          </div>

          <button
            type="submit"
            className={`w-full py-3 px-4 rounded-lg text-white font-bold shadow-md ${morandiButtonPrimary} transition-transform transform active:scale-95`}
          >
            進入行程空間 🚀
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default App;
