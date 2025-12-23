// src/App.js
import React, { useState, Suspense } from "react";

// 常數與設定
import { DEFAULT_DAYS_OPTIONS } from "./utils/constants";
import { useTheme } from "./utils/theme";
import { ICON_SVG } from "./utils/icons";

// 組件
import Modal from "./components/Modal";
import ItineraryList from "./components/ItineraryList";
import ConfirmModal from "./components/ConfirmModal";
const TripDetails = React.lazy(() => import("./components/TripDetails"));

// Hooks
import { useAuth } from "./hooks/useAuth";
import { useItineraries } from "./hooks/useItineraries";

const App = () => {
  const { theme, changeTheme, currentThemeId, allThemes } = useTheme();

  const {
    userId,
    isAuthReady,
    authError: errorMessage,
    loginWithCode,
    logout,
    isAnonymous,
    userCode,
  } = useAuth();

  const {
    allItineraries,
    isLoading: isItinerariesLoading,
    createItinerary: hookCreateItinerary,
    updateItinerary: hookUpdateItinerary,
    deleteItinerary: hookDeleteItinerary,
  } = useItineraries(userId);

  const [itineraryId, setItineraryId] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState("");

  const [isCreatingItinerary, setIsCreatingItinerary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newItineraryData, setNewItineraryData] = useState({
    title: "",
    days: 5,
    startDate: new Date().toISOString().split("T")[0],
    travelerCount: 1,
  });

  const [isEditItineraryModalOpen, setIsEditItineraryModalOpen] =
    useState(false);
  const [editingItineraryData, setEditingItineraryData] = useState({
    id: null,
    title: "",
    days: 1,
    startDate: "",
    travelerCount: 1,
  });

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!accessCodeInput.trim()) return;
    setIsSubmitting(true);
    try {
      await loginWithCode(accessCodeInput);
      setIsLoginModalOpen(false);
      setAccessCodeInput("");
    } catch (e) {
      alert("登入失敗：" + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateItinerary = async () => {
    if (!newItineraryData.title.trim()) return;
    try {
      await hookCreateItinerary({
        title: newItineraryData.title.trim(),
        days: newItineraryData.days,
        startDate: newItineraryData.startDate,
        travelerCount: newItineraryData.travelerCount,
      });
      setIsCreatingItinerary(false);
      setNewItineraryData({
        title: "",
        days: 5,
        startDate: new Date().toISOString().split("T")[0],
        travelerCount: 1,
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
      travelerCount: itinerary.travelerCount || 1,
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
        travelerCount: editingItineraryData.travelerCount,
      });
      setIsEditItineraryModalOpen(false);
    } catch (error) {
      console.error("更新失敗:", error);
      alert("更新失敗: " + error.message);
    }
  };

  const handleDetailTitleUpdate = async (id, newTitle) => {
    try {
      await hookUpdateItinerary(id, { title: newTitle });
    } catch (error) {
      console.error("更新標題失敗:", error);
      alert("更新標題失敗");
    }
  };

  const handleDeleteClick = (id) => {
    setItemToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await hookDeleteItinerary(itemToDelete);
    } catch (e) {
      console.error("刪除行程失敗", e);
      alert("刪除失敗");
    } finally {
      setItemToDelete(null);
    }
  };

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-20">
      <div
        className={`animate-spin rounded-full h-12 w-12 border-b-2 ${theme.spinnerBorder}`}
      ></div>
    </div>
  );

  if (isItinerariesLoading && !errorMessage)
    return (
      <div
        className={`flex items-center justify-center min-h-screen ${theme.background}`}
      >
        <div
          className={`animate-spin rounded-full h-12 w-12 border-b-2 ${theme.spinnerBorder}`}
        ></div>
      </div>
    );

  const currentItinerary = allItineraries.find((i) => i.id === itineraryId);

  return (
    <div
      className={`min-h-screen ${theme.background} ${theme.textMain} ${theme.font} p-4 sm:p-8 pb-28 relative transition-colors duration-500`}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&family=Yuji+Syuku&family=Zen+Maru+Gothic:wght@500;700&family=Zen+Kaku+Gothic+New:wght@300;400;500;700&display=swap');
        
        .font-serif-tc { font-family: 'Yuji Syuku', serif; letter-spacing: 0.05em; }
        .font-cute { font-family: 'Zen Maru Gothic', sans-serif; letter-spacing: 0.05em; }
        .font-sans-tc { font-family: 'Noto Sans TC', sans-serif; letter-spacing: 0.02em; }
        .font-zen-kaku { font-family: 'Zen Kaku Gothic New', 'Noto Sans TC', sans-serif; letter-spacing: 0.05em; }

        /* 全局強制修正輸入框寬度 */
        input, select, textarea {
          max-width: 100% !important;
          box-sizing: border-box !important;
        }

        /* 針對 iOS Date Input 的特殊處理 */
        input[type="date"] {
          min-width: 0 !important;
          -webkit-appearance: none;
          display: flex;
          align-items: center;
        }
      `}</style>

      {/* 主題切換按鈕 */}
      <div className="flex justify-between items-center mb-4 z-20 relative">
        <div className="flex space-x-2 bg-white/50 p-1 rounded-full backdrop-blur-sm">
          {allThemes.map((t) => {
            const activeColorClass =
              t.id === "muji" ? "bg-[#8E8071]" : "bg-slate-600";
            return (
              <button
                key={t.id}
                onClick={() => changeTheme(t.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  currentThemeId === t.id
                    ? `${activeColorClass} text-white shadow-md scale-105`
                    : "bg-transparent text-gray-500 hover:bg-white/80"
                }`}
              >
                {t.name}
              </button>
            );
          })}
        </div>

        <div>
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
      </div>

      {!itineraryId ? (
        <ItineraryList
          allItineraries={allItineraries}
          onSelect={(id) => setItineraryId(id)}
          onDelete={handleDeleteClick}
          onEdit={openEditItineraryModal}
          onOpenCreateModal={() => setIsCreatingItinerary(true)}
        />
      ) : currentItinerary ? (
        <Suspense fallback={<LoadingSpinner />}>
          <TripDetails
            userId={userId}
            itinerary={currentItinerary}
            allItineraries={allItineraries}
            onBack={() => setItineraryId(null)}
            onUpdateTitle={handleDetailTitleUpdate}
          />
        </Suspense>
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
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${theme.ringFocus} ${theme.borderFocus}`}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 min-w-0">
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
                /* 加入 style 防止爆出 */
                style={{ width: "100%" }}
                className={`block px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm ${theme.ringFocus} ${theme.borderFocus}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                旅伴人數
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  min="1"
                  value={newItineraryData.travelerCount}
                  onChange={(e) =>
                    setNewItineraryData({
                      ...newItineraryData,
                      travelerCount: parseInt(e.target.value) || 1,
                    })
                  }
                  className={`flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm ${theme.ringFocus} ${theme.borderFocus}`}
                />
                <span className="ml-2 text-sm text-gray-500 shrink-0">人</span>
              </div>
            </div>
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
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${theme.ringFocus} ${theme.borderFocus}`}
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
            disabled={!newItineraryData.title.trim() || isSubmitting}
            className={`w-full py-2 px-4 rounded-md text-white ${theme.buttonPrimary} disabled:opacity-50 mt-4 flex justify-center items-center`}
          >
            {isSubmitting ? "建立中..." : "開始規劃"}
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
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${theme.ringFocus} ${theme.borderFocus}`}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 min-w-0">
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
                style={{ width: "100%" }}
                className={`block px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm ${theme.ringFocus} ${theme.borderFocus}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                旅伴人數
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  min="1"
                  value={editingItineraryData.travelerCount}
                  onChange={(e) =>
                    setEditingItineraryData({
                      ...editingItineraryData,
                      travelerCount: parseInt(e.target.value) || 1,
                    })
                  }
                  className={`flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm ${theme.ringFocus} ${theme.borderFocus}`}
                />
                <span className="ml-2 text-sm text-gray-500 shrink-0">人</span>
              </div>
            </div>
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
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${theme.ringFocus} ${theme.borderFocus}`}
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
            className={`w-full py-2 px-4 rounded-md text-white ${theme.buttonPrimary} disabled:opacity-50 mt-4`}
          >
            儲存修改
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        title="輸入行程通行碼"
      >
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div
            className={`${theme.loginModalBg} p-4 rounded-lg text-sm ${theme.loginText} mb-4 border border-[#DEC9B5]/30`}
          >
            <p className="font-bold flex items-center mb-1">
              <ICON_SVG.listCollapse className="w-4 h-4 mr-1" />
              通行碼機制說明
            </p>
            <ul className="list-disc list-outside ml-4 mt-1 space-y-1 text-xs opacity-90">
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
              className={`block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm ${theme.ringFocus} ${theme.borderFocus} text-lg tracking-wide text-center`}
            />
          </div>

          <button
            type="submit"
            className={`w-full py-3 px-4 rounded-lg text-white font-bold shadow-md ${theme.buttonPrimary} transition-transform transform active:scale-95`}
          >
            進入行程空間
          </button>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="刪除旅程"
        message="確定要永久刪除此行程及其所有資料嗎？此操作無法復原。"
        confirmText="刪除"
        isDanger={true}
      />
    </div>
  );
};

export default App;
