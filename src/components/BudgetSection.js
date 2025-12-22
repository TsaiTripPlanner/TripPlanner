// src/components/BudgetSection.js
import React, { useState, useEffect, memo, useMemo } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db, appId } from "../config/firebase";
import { ICON_SVG } from "../utils/icons";
import { useTheme } from "../utils/theme";
import {
  CURRENCIES,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
} from "../utils/constants";
import ConfirmModal from "./ConfirmModal";

const BudgetSection = memo(
  ({ itineraryId, userId, totalDays, itineraryStartDate }) => {
    const { theme } = useTheme();
    const [expenses, setExpenses] = useState([]);
    const [newItem, setNewItem] = useState({
      title: "",
      amount: "",
      currency: "TWD",
      category: "food",
      paymentMethod: "cash",
      day: 1,
    });
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({
      title: "",
      amount: "",
      currency: "TWD",
      category: "food",
      paymentMethod: "cash",
      day: 1,
    });
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    useEffect(() => {
      if (!itineraryId || !userId || !db) return;
      const unsubscribe = onSnapshot(
        collection(
          db,
          `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/expenses`
        ),
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          data.sort((a, b) =>
            a.day !== b.day
              ? a.day - b.day
              : (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
          );
          setExpenses(data);
        }
      );
      return () => unsubscribe();
    }, [itineraryId, userId]);

    const currencyTotals = useMemo(
      () =>
        expenses.reduce((acc, item) => {
          const curr = item.currency || "TWD";
          acc[curr] = (acc[curr] || 0) + (parseFloat(item.amount) || 0);
          return acc;
        }, {}),
      [expenses]
    );

    const addExpense = async () => {
      if (!newItem.title.trim() || newItem.amount === "") return;
      try {
        await addDoc(
          collection(
            db,
            `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/expenses`
          ),
          {
            ...newItem,
            title: newItem.title.trim(),
            amount: parseFloat(newItem.amount),
            day: Number(newItem.day),
            createdAt: serverTimestamp(),
          }
        );
        setNewItem({ ...newItem, title: "", amount: "" });
      } catch (e) {
        alert("新增失敗");
      }
    };

    const saveEdit = async (id) => {
      if (!editData.title.trim() || editData.amount === "") return;
      try {
        await updateDoc(
          doc(
            db,
            `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/expenses/${id}`
          ),
          {
            ...editData,
            title: editData.title.trim(),
            amount: parseFloat(editData.amount),
            day: Number(editData.day),
            updatedAt: serverTimestamp(),
          }
        );
        setEditingId(null);
      } catch (e) {
        alert("更新失敗");
      }
    };

    const handleDeleteClick = (id) => setDeleteConfirmId(id);

    const getDisplayDate = (dayNum) => {
      if (!itineraryStartDate) return "";
      const start = new Date(itineraryStartDate);
      start.setDate(start.getDate() + (dayNum - 1));
      return `(${start.getMonth() + 1}/${start.getDate()})`;
    };

    const { groupedExpenses, sortedDays } = useMemo(() => {
      const grouped = expenses.reduce((acc, item) => {
        const dayKey = item.day || 1;
        if (!acc[dayKey]) acc[dayKey] = [];
        acc[dayKey].push(item);
        return acc;
      }, {});
      return {
        groupedExpenses: grouped,
        sortedDays: Object.keys(grouped).sort((a, b) => Number(a) - Number(b)),
      };
    }, [expenses]);

    return (
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
        <h2
          className={`text-xl font-bold flex items-center mb-6 ${theme.accentText}`}
        >
          <ICON_SVG.wallet className="w-6 h-6 mr-2" /> 旅行費用
        </h2>

        {/* 總額匯總區 */}
        <div
          className={`${theme.infoBoxBg} p-4 rounded-lg border ${theme.infoBoxBorder} mb-6`}
        >
          <h3 className={`text-sm font-bold ${theme.infoBoxText} mb-2`}>
            總支出 (依幣別)
          </h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(currencyTotals).length === 0 ? (
              <span className={`text-sm ${theme.itemMetaText}`}>
                尚未有紀錄
              </span>
            ) : (
              Object.entries(currencyTotals).map(([curr, total]) => (
                <div
                  key={curr}
                  className="bg-white px-3 py-1.5 rounded shadow-sm border border-gray-100 flex items-center"
                >
                  <span
                    className={`text-xs font-bold ${theme.infoBoxBg} ${theme.infoBoxText} px-1.5 py-0.5 rounded mr-2`}
                  >
                    {curr}
                  </span>
                  <span className="font-mono font-medium text-gray-700">
                    {total.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 新增費用區塊：採用全響應式堆疊佈局 */}
        <div
          className={`mb-6 p-4 ${theme.itemInputBg} rounded-lg space-y-3 shadow-inner`}
        >
          {/* 第一行：天數與類別 */}
          <div className="flex gap-2">
            <div className="w-1/3">
              <label className="block text-[10px] text-gray-400 mb-1 ml-1">
                天數
              </label>
              <select
                value={newItem.day}
                onChange={(e) =>
                  setNewItem({ ...newItem, day: e.target.value })
                }
                className="w-full px-2 py-2 border border-gray-300 rounded text-sm bg-white"
              >
                {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Day {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-2/3">
              <label className="block text-[10px] text-gray-400 mb-1 ml-1">
                類別
              </label>
              <select
                value={newItem.category}
                onChange={(e) =>
                  setNewItem({ ...newItem, category: e.target.value })
                }
                className="w-full px-2 py-2 border border-gray-300 rounded bg-white text-sm"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 第二行：項目名稱 (獨佔一行) */}
          <div>
            <label className="block text-[10px] text-gray-400 mb-1 ml-1">
              項目名稱
            </label>
            <input
              type="text"
              placeholder="例如：拉麵、藥妝..."
              value={newItem.title}
              onChange={(e) =>
                setNewItem({ ...newItem, title: e.target.value })
              }
              onKeyDown={(e) => e.key === "Enter" && addExpense()}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>

          {/* 第三行：金額、幣別、按鈕 */}
          <div>
            <label className="block text-[10px] text-gray-400 mb-1 ml-1">
              金額與幣別
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                placeholder="金額"
                value={newItem.amount}
                onChange={(e) =>
                  setNewItem({ ...newItem, amount: e.target.value })
                }
                onKeyDown={(e) => e.key === "Enter" && addExpense()}
                className="flex-grow min-w-0 px-3 py-2 border border-gray-300 rounded text-sm"
              />
              <select
                value={newItem.currency}
                onChange={(e) =>
                  setNewItem({ ...newItem, currency: e.target.value })
                }
                className="w-20 shrink-0 px-1 py-2 border border-gray-300 rounded bg-white text-sm text-center"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button
                onClick={addExpense}
                className={`shrink-0 px-4 py-2 text-white rounded text-sm font-bold shadow-sm ${theme.buttonPrimary}`}
              >
                記帳
              </button>
            </div>
          </div>
        </div>

        {/* 費用列表 */}
        <div className="space-y-6">
          {sortedDays.map((dayKey) => {
            const dailyTotal = groupedExpenses[dayKey].reduce((acc, item) => {
              const curr = item.currency || "TWD";
              acc[curr] = (acc[curr] || 0) + (parseFloat(item.amount) || 0);
              return acc;
            }, {});
            return (
              <div key={dayKey}>
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-100">
                  <h4 className={`text-md font-bold ${theme.accentText}`}>
                    Day {dayKey}{" "}
                    <span className="text-xs ml-1 font-normal text-gray-400">
                      {getDisplayDate(dayKey)}
                    </span>
                  </h4>
                  <div className="flex flex-wrap justify-end gap-1">
                    {Object.entries(dailyTotal).map(([c, t]) => (
                      <span
                        key={c}
                        className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded"
                      >
                        {c} {t.toLocaleString()}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  {groupedExpenses[dayKey].map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 ${theme.itemRowBg} rounded-lg hover:shadow-sm transition`}
                    >
                      {editingId === item.id ? (
                        /* === 編輯模式：解決手機版寬度溢出 === */
                        <div className="w-full flex flex-col gap-3">
                          {/* 編輯第一行：天數與類別 */}
                          <div className="flex gap-2">
                            <select
                              value={editData.day}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  day: e.target.value,
                                })
                              }
                              className="w-1/3 px-2 py-2 border border-gray-300 rounded text-sm bg-white"
                            >
                              {Array.from(
                                { length: totalDays },
                                (_, i) => i + 1
                              ).map((d) => (
                                <option key={d} value={d}>
                                  Day {d}
                                </option>
                              ))}
                            </select>
                            <select
                              value={editData.category}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  category: e.target.value,
                                })
                              }
                              className="w-2/3 px-2 py-2 border border-gray-300 rounded text-sm bg-white"
                            >
                              {EXPENSE_CATEGORIES.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* 編輯第二行：名稱 (獨佔一行) */}
                          <input
                            type="text"
                            value={editData.title}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                title: e.target.value,
                              })
                            }
                            onKeyDown={(e) =>
                              e.key === "Enter" && saveEdit(item.id)
                            }
                            className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                            placeholder="項目名稱"
                          />

                          {/* 編輯第三行：金額、幣別與功能按鈕 */}
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              inputMode="decimal"
                              value={editData.amount}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  amount: e.target.value,
                                })
                              }
                              onKeyDown={(e) =>
                                e.key === "Enter" && saveEdit(item.id)
                              }
                              className="flex-grow min-w-0 px-2 py-2 border border-gray-300 rounded text-sm"
                              placeholder="金額"
                            />
                            <select
                              value={editData.currency}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  currency: e.target.value,
                                })
                              }
                              className="w-20 shrink-0 px-1 py-2 border border-gray-300 rounded text-sm bg-white text-center"
                            >
                              {CURRENCIES.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>

                            {/* 儲存與取消按鈕 */}
                            <div className="flex gap-1 shrink-0">
                              <button
                                onClick={() => saveEdit(item.id)}
                                className="bg-green-500 text-white p-2 rounded shadow-sm active:scale-95"
                              >
                                <ICON_SVG.check className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="bg-gray-200 text-gray-600 p-2 rounded shadow-sm active:scale-95"
                              >
                                <ICON_SVG.xMark className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* 非編輯模式 */
                        <div className="flex justify-between items-center">
                          <div className="flex items-center min-w-0">
                            <div
                              className={`w-9 h-9 rounded-full ${theme.infoBoxBg} flex items-center justify-center mr-3 shrink-0`}
                            >
                              {(() => {
                                const cat = EXPENSE_CATEGORIES.find(
                                  (c) => c.id === item.category
                                );
                                const Icon = ICON_SVG[cat?.icon || "dots"];
                                return <Icon className="w-5 h-5" />;
                              })()}
                            </div>
                            <span className="text-sm font-medium truncate">
                              {item.title}
                            </span>
                          </div>
                          <div className="flex items-center shrink-0 ml-2">
                            <div className="text-right mr-3">
                              <div className="font-bold text-sm">
                                {item.currency} {item.amount.toLocaleString()}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setEditingId(item.id);
                                setEditData(item);
                              }}
                              className="text-gray-400 hover:text-blue-500 p-1.5"
                            >
                              <ICON_SVG.pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(item.id)}
                              className="text-gray-400 hover:text-red-400 p-1.5"
                            >
                              <ICON_SVG.trash className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <ConfirmModal
          isOpen={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={async () => {
            await deleteDoc(
              doc(
                db,
                `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/expenses/${deleteConfirmId}`
              )
            );
            setDeleteConfirmId(null);
          }}
          title="刪除消費紀錄"
          message="確定要刪除嗎？"
          confirmText="刪除"
          isDanger={true}
        />
      </div>
    );
  }
);
export default BudgetSection;
