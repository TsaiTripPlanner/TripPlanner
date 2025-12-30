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
import { CURRENCIES, EXPENSE_CATEGORIES } from "../utils/constants";
import ConfirmModal from "./ConfirmModal";

const BudgetSection = memo(
  ({ itineraryId, userId, totalDays, itineraryStartDate, travelerCount }) => {
    const { theme } = useTheme();
    const [expenses, setExpenses] = useState([]);
    const count = travelerCount || 1;

    const [expandedId, setExpandedId] = useState(null);

    const [newItem, setNewItem] = useState({
      title: "",
      amount: "",
      currency: "TWD",
      category: "food",
      isPerPerson: false,
      day: 1,
      description: "",
    });

    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
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

    const totals = useMemo(() => {
      return expenses.reduce((acc, item) => {
        const curr = item.currency || "TWD";
        const amount = parseFloat(item.amount) || 0;
        const finalAmount = item.isPerPerson ? amount * count : amount;
        acc[curr] = (acc[curr] || 0) + finalAmount;
        return acc;
      }, {});
    }, [expenses, count]);

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
            description: newItem.description.trim(),
            amount: parseFloat(newItem.amount),
            day: Number(newItem.day),
            createdAt: serverTimestamp(),
          }
        );
        setNewItem({ ...newItem, title: "", amount: "", description: "" });
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
            description: (editData.description || "").trim(),
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

    const getDisplayDate = (dayNum) => {
      if (!itineraryStartDate) return "";
      const start = new Date(itineraryStartDate);
      start.setDate(start.getDate() + (dayNum - 1));
      return `${start.getMonth() + 1}/${start.getDate()}`;
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

        {/* 頂部匯總 */}
        <div
          className={`${theme.infoBoxBg} p-4 rounded-lg border ${theme.infoBoxBorder} mb-6`}
        >
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            {Object.entries(totals).length === 0 ? (
              <span className={`text-sm ${theme.itemMetaText}`}>
                尚未有紀錄
              </span>
            ) : (
              Object.entries(totals).map(([curr, total]) => (
                <div key={curr} className="flex flex-col">
                  <div className="text-[10px] font-bold text-gray-400 mb-1 uppercase">
                    {curr} 總結
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-[9px] text-gray-400 block">
                        👤 每人平均
                      </span>
                      <span className="text-lg font-bold text-slate-700 leading-none">
                        {Math.round(total / count).toLocaleString()}
                      </span>
                    </div>
                    <div className="h-6 w-px bg-gray-200"></div>
                    <div>
                      <span className="text-[9px] text-gray-400 block">
                        👥 整團總計
                      </span>
                      <span className="text-sm font-medium text-gray-400 leading-none">
                        {Math.round(total).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 輸入區 */}
        <div
          className={`mb-6 p-4 ${theme.itemInputBg} rounded-lg space-y-3 shadow-inner`}
        >
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
          <input
            type="text"
            placeholder="項目名稱 (例如：晚餐)"
            value={newItem.title}
            onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-slate-400"
          />
          <textarea
            placeholder="細項備註 (選填，例如：拉麵 200, 煎餃 100...)"
            value={newItem.description}
            onChange={(e) =>
              setNewItem({ ...newItem, description: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded text-xs outline-none focus:ring-1 focus:ring-slate-400"
            rows="2"
          />
          <div className="flex gap-2">
            <div className="relative flex-grow min-w-0">
              <input
                type="number"
                inputMode="decimal"
                placeholder={
                  newItem.isPerPerson ? "👤 單人金額" : "👥 總額金額"
                }
                value={newItem.amount}
                onChange={(e) =>
                  setNewItem({ ...newItem, amount: e.target.value })
                }
                className="w-full pl-3 pr-14 py-2 border border-gray-300 rounded text-sm outline-none"
              />
              {count > 1 && (
                <button
                  onClick={() =>
                    setNewItem({
                      ...newItem,
                      isPerPerson: !newItem.isPerPerson,
                    })
                  }
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    newItem.isPerPerson
                      ? "bg-slate-600 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {newItem.isPerPerson ? "👤 單人" : "👥 總額"}
                </button>
              )}
            </div>
            <select
              value={newItem.currency}
              onChange={(e) =>
                setNewItem({ ...newItem, currency: e.target.value })
              }
              className="w-16 shrink-0 px-1 py-2 border border-gray-300 rounded bg-white text-sm text-center"
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

        {/* 費用清單 */}
        <div className="space-y-6">
          {sortedDays.map((dayKey) => (
            <div key={dayKey}>
              <div className="flex items-end justify-between mb-3 pb-1 border-b border-gray-100">
                <div className="flex items-baseline gap-2">
                  <span className={`text-base font-bold ${theme.accentText}`}>
                    Day {dayKey}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {getDisplayDate(dayKey)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {groupedExpenses[dayKey].map((item) => {
                  const isEditing = editingId === item.id;
                  const isExpanded = expandedId === item.id;

                  return (
                    <div key={item.id}>
                      {isEditing ? (
                        /* === 編輯模式 === */
                       <div className="w-full flex flex-col gap-3 bg-white p-3 rounded-lg border-2 border-slate-400 shadow-sm animate-fade-in">
                         {/* 天數與類別 */}
                         <div className="flex gap-2">
                           <div className="w-1/3">
                             <label className="block text-[10px] text-gray-400 mb-1 ml-1 font-bold">天數</label>
                             <select
                               value={editData.day}
                               onChange={(e) =>
                                 setEditData({
                                   ...editData,
                                   day: Number(e.target.value),
                                 })
                               }
                               className="w-full px-2 py-2 border border-gray-300 rounded text-sm bg-white"
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
                           </div>
                           <div className="w-2/3">
                             <label className="block text-[10px] text-gray-400 mb-1 ml-1 font-bold">類別</label>
                             <select
                               value={editData.category}
                               onChange={(e) =>
                                 setEditData({
                                   ...editData,
                                   category: e.target.value,
                                 })
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

                         {/* 項目名稱 */}
                         <div>
                           <label className="block text-[10px] text-gray-400 mb-1 ml-1 font-bold">項目名稱</label>
                           <input
                             type="text"
                             value={editData.title}
                             onChange={(e) =>
                               setEditData({
                                 ...editData,
                                 title: e.target.value,
                               })
                             }
                             className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-slate-400 outline-none"
                           />
                          </div>

                         {/* 細項備註 */}
                         <div>
                           <label className="block text-[10px] text-gray-400 mb-1 ml-1 font-bold">細項備註 (選填)</label>
                           <textarea
                             value={editData.description || ""}
                             onChange={(e) =>
                               setEditData({
                                 ...editData,
                                 description: e.target.value,
                               })
                             }
                             className="w-full px-2 py-2 border border-gray-300 rounded text-xs outline-none focus:ring-1 focus:ring-slate-400"
                             placeholder="細項備註"
                             rows="2"
                           />
                         </div>

                         {/* 金額與操作按鈕 */}
                         <div>
                           <label className="block text-[10px] text-gray-400 mb-1 ml-1 font-bold">金額</label>
                           <div className="flex items-center gap-2">
                             <div className="relative flex-grow">
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
                                 className="w-full pl-2 pr-14 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-slate-400 outline-none"
                               />
                               {count > 1 && (
                                 <button
                                   onClick={() =>
                                     setEditData({
                                       ...editData,
                                       isPerPerson: !editData.isPerPerson,
                                     })
                                   }
                                   className={`absolute right-1 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                     editData.isPerPerson
                                       ? "bg-slate-600 text-white"
                                       : "bg-gray-100 text-gray-500"
                                    }`}
                                 >
                                   {editData.isPerPerson ? "👤 單人" : "👥 總額"}
                                 </button>
                               )}
                             </div>
                             <div className="flex gap-1 shrink-0">
                               <button
                                 onClick={() => saveEdit(item.id)}
                                 className="bg-green-500 text-white p-2 rounded shadow-sm active:scale-95 transition"
                               >
                                 <ICON_SVG.check className="w-5 h-5" />
                               </button>
                               <button
                                 onClick={() => setEditingId(null)}
                                 className="bg-gray-200 text-gray-600 p-2 rounded shadow-sm active:scale-95 transition"
                               >
                                 <ICON_SVG.xMark className="w-5 h-5" />
                               </button>
                             </div>
                           </div>
                         </div>
                       </div>
                      ) : (
                        /* === 顯示模式 === */
                        <div
                          onClick={() => {
                            if (item.description)
                              setExpandedId(isExpanded ? null : item.id);
                          }}
                          className={`p-3 ${
                            theme.itemRowBg
                          } rounded-lg border border-transparent transition ${
                            item.description
                              ? "cursor-pointer hover:bg-gray-100/50"
                              : "cursor-default"
                          }`}
                        >
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
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium truncate text-slate-700">
                                  {item.title}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center shrink-0 ml-2 text-right">
                              <div className="mr-3">
                                <div className="font-bold text-sm text-slate-700 flex items-center justify-end">
                                  {count > 1 && (
                                    <span
                                      className={`text-[10px] mr-1 ${theme.itemMetaText}`}
                                    >
                                      {item.isPerPerson ? "👤" : "👥"}
                                    </span>
                                  )}
                                  <span>
                                    {item.currency}{" "}
                                    {item.amount.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <div
                                className="flex"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => {
                                    setEditingId(item.id);
                                    setEditData(item);
                                  }}
                                  className="text-gray-300 hover:text-slate-500 p-1.5"
                                >
                                  <ICON_SVG.pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(item.id)}
                                  className="text-gray-300 hover:text-red-400 p-1.5"
                                >
                                  <ICON_SVG.trash className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                          {isExpanded && item.description && (
                            <div className="mt-2 pt-2 border-t border-dashed border-gray-200 text-xs text-gray-400 whitespace-pre-wrap leading-relaxed animate-fade-in">
                              {item.description}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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
