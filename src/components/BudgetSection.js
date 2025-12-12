// src/components/BudgetSection.js
import React, { useState, useEffect, memo } from "react";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

// 引用外部設定與工具
import { db, appId } from "../config/firebase";
import { ICON_SVG } from "../utils/icons";
import { morandiAccentText, morandiButtonPrimary } from "../utils/theme";

// 這些常數原本在 App.js，現在搬過來這裡，因為只有這裡用得到
const CURRENCIES = ["TWD", "JPY", "KRW", "USD", "EUR", "CNY", "THB", "VND"];
const EXPENSE_CATEGORIES = [
  { id: "food", name: "飲食", icon: "food" },
  { id: "transport", name: "交通", icon: "transport" },
  { id: "shopping", name: "購物", icon: "shopping" },
  { id: "accommodation", name: "住宿", icon: "home" },
  { id: "entertainment", name: "娛樂", icon: "ticket" },
  { id: "other", name: "其他", icon: "dots" },
];

// --- 旅行費用 (BudgetSection) 組件 ---
const BudgetSection = memo(
  ({ itineraryId, userId, totalDays, itineraryStartDate }) => {
    const [expenses, setExpenses] = useState([]);

    const [newItem, setNewItem] = useState({
      title: "",
      amount: "",
      currency: "TWD",
      category: "food",
      day: 1,
    });

    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({
      title: "",
      amount: "",
      currency: "TWD",
      category: "food",
      day: 1,
    });

    useEffect(() => {
      if (!itineraryId || !userId || !db) return;
      const expensesRef = collection(
        db,
        `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/expenses`
      );

      // ★★★ 修正：移除 orderBy，改用純 JS 排序，避免需要建立複合索引導致無法顯示資料 ★★★
      const q = query(expensesRef);

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // 前端排序：先依天數(由小到大)，再依建立時間(由新到舊)
        data.sort((a, b) => {
          if (a.day !== b.day) return a.day - b.day;
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        });

        setExpenses(data);
      });
      return () => unsubscribe();
    }, [itineraryId, userId]);

    const currencyTotals = expenses.reduce((acc, item) => {
      const curr = item.currency || "TWD";
      const amt = parseFloat(item.amount) || 0;
      acc[curr] = (acc[curr] || 0) + amt;
      return acc;
    }, {});

    const addExpense = async () => {
      // 簡單驗證：標題不為空，金額不是 NaN
      if (!newItem.title.trim() || newItem.amount === "") return;

      try {
        await addDoc(
          collection(
            db,
            `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/expenses`
          ),
          {
            title: newItem.title.trim(),
            amount: parseFloat(newItem.amount),
            currency: newItem.currency,
            category: newItem.category,
            day: Number(newItem.day),
            createdAt: serverTimestamp(),
          }
        );
        // 新增成功後，保留天數、幣別、類別，只清除標題和金額
        setNewItem({ ...newItem, title: "", amount: "" });
      } catch (e) {
        console.error(e);
        alert("新增失敗，請檢查網路連線");
      }
    };

    const startEdit = (item) => {
      setEditingId(item.id);
      setEditData({
        title: item.title,
        amount: item.amount,
        currency: item.currency || "TWD",
        category: item.category || "other",
        day: item.day || 1,
      });
    };

    const saveEdit = async (id) => {
      try {
        await updateDoc(
          doc(
            db,
            `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/expenses/${id}`
          ),
          {
            title: editData.title.trim(),
            amount: parseFloat(editData.amount),
            currency: editData.currency,
            category: editData.category,
            day: Number(editData.day),
            updatedAt: serverTimestamp(),
          }
        );
        setEditingId(null);
      } catch (e) {
        console.error(e);
        alert("更新失敗");
      }
    };

    const deleteExpense = async (id) => {
      if (!window.confirm("確定刪除此筆消費？")) return;
      try {
        await deleteDoc(
          doc(
            db,
            `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/expenses/${id}`
          )
        );
      } catch (e) {
        console.error(e);
      }
    };

    const getCategoryIcon = (catId) => {
      const category = EXPENSE_CATEGORIES.find((c) => c.id === catId);
      const iconName = category ? category.icon : "dots";
      const IconComponent = ICON_SVG[iconName] || ICON_SVG.dots;
      return <IconComponent className="w-5 h-5" />;
    };

    const getDisplayDate = (dayNum) => {
      if (!itineraryStartDate) return "";
      const start = new Date(itineraryStartDate);
      start.setDate(start.getDate() + (dayNum - 1));
      return `(${start.getMonth() + 1}/${start.getDate()})`;
    };

    const groupedExpenses = expenses.reduce((acc, item) => {
      const dayKey = item.day || 1;
      if (!acc[dayKey]) acc[dayKey] = [];
      acc[dayKey].push(item);
      return acc;
    }, {});

    const sortedDays = Object.keys(groupedExpenses).sort(
      (a, b) => Number(a) - Number(b)
    );

    return (
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-gray-700 mb-6 flex items-center">
          <ICON_SVG.wallet className={`w-6 h-6 mr-2 ${morandiAccentText}`} />
          旅行費用
        </h2>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
          <h3 className="text-sm font-bold text-gray-500 mb-2">
            總支出 (依幣別)
          </h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(currencyTotals).length === 0 ? (
              <span className="text-gray-400 text-sm">尚未有紀錄</span>
            ) : (
              Object.entries(currencyTotals).map(([curr, total]) => (
                <div
                  key={curr}
                  className="bg-white px-3 py-1.5 rounded shadow-sm border border-gray-100 flex items-center"
                >
                  <span className="text-xs font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded mr-2">
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

        <div className="mb-6 p-4 bg-gray-100 rounded-lg space-y-3">
          <div className="flex items-center space-x-2">
            <select
              value={newItem.day}
              onChange={(e) => setNewItem({ ...newItem, day: e.target.value })}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded focus:ring-slate-500 text-sm bg-white"
            >
              {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  Day {d}
                </option>
              ))}
            </select>
            <select
              value={newItem.category}
              onChange={(e) =>
                setNewItem({ ...newItem, category: e.target.value })
              }
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded focus:ring-slate-500 bg-white text-sm"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="項目名稱"
              value={newItem.title}
              onChange={(e) =>
                setNewItem({ ...newItem, title: e.target.value })
              }
              className="flex-grow px-3 py-2 border border-gray-300 rounded focus:ring-slate-500 text-sm"
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="金額"
                value={newItem.amount}
                onChange={(e) =>
                  setNewItem({ ...newItem, amount: e.target.value })
                }
                className="w-24 px-3 py-2 border border-gray-300 rounded focus:ring-slate-500 text-sm"
              />
              <select
                value={newItem.currency}
                onChange={(e) =>
                  setNewItem({ ...newItem, currency: e.target.value })
                }
                className="w-20 px-1 py-2 border border-gray-300 rounded focus:ring-slate-500 bg-white text-sm"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button
                onClick={addExpense}
                className={`px-4 py-2 text-white rounded text-sm font-medium ${morandiButtonPrimary} whitespace-nowrap`}
              >
                記帳
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {sortedDays.length === 0 ? (
            <p className="text-center text-gray-400 py-4">目前沒有消費紀錄。</p>
          ) : (
            sortedDays.map((dayKey) => {
              const dailyTotal = groupedExpenses[dayKey].reduce((acc, item) => {
                const curr = item.currency || "TWD";
                const amt = parseFloat(item.amount) || 0;
                acc[curr] = (acc[curr] || 0) + amt;
                return acc;
              }, {});

              return (
                <div key={dayKey}>
                  <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-200">
                    <h4
                      className={`text-md font-bold ${morandiAccentText} flex items-center`}
                    >
                      Day {dayKey}{" "}
                      <span className="text-xs text-gray-400 ml-2 font-normal">
                        {getDisplayDate(dayKey)}
                      </span>
                    </h4>
                    <div className="flex gap-2">
                      {Object.entries(dailyTotal).map(([c, t]) => (
                        <span
                          key={c}
                          className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded"
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
                        className="p-3 bg-gray-50 rounded-lg flex justify-between items-center hover:bg-white hover:shadow-sm transition border border-transparent hover:border-gray-100"
                      >
                        {editingId === item.id ? (
                          <div className="w-full flex flex-col gap-2">
                            <div className="flex gap-2">
                              <select
                                value={editData.day}
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    day: e.target.value,
                                  })
                                }
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
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
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                {EXPENSE_CATEGORIES.map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                value={editData.title}
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    title: e.target.value,
                                  })
                                }
                                className="flex-grow px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  value={editData.amount}
                                  onChange={(e) =>
                                    setEditData({
                                      ...editData,
                                      amount: e.target.value,
                                    })
                                  }
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <select
                                  value={editData.currency}
                                  onChange={(e) =>
                                    setEditData({
                                      ...editData,
                                      currency: e.target.value,
                                    })
                                  }
                                  className="w-18 px-1 py-1 border border-gray-300 rounded text-sm"
                                >
                                  {CURRENCIES.map((c) => (
                                    <option key={c} value={c}>
                                      {c}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => saveEdit(item.id)}
                                  className="text-green-600 hover:text-green-800 p-1"
                                >
                                  <ICON_SVG.check className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                  <ICON_SVG.xMark className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center">
                              <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-slate-500 mr-3 shadow-sm">
                                {getCategoryIcon(item.category)}
                              </div>
                              <span className="text-gray-800 text-sm font-medium">
                                {item.title}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <div className="text-right mr-3">
                                <div className="font-bold text-gray-700 text-sm">
                                  <span className="text-xs text-gray-400 font-normal mr-1">
                                    {item.currency}
                                  </span>
                                  {item.amount.toLocaleString()}
                                </div>
                              </div>
                              <button
                                onClick={() => startEdit(item)}
                                className="text-gray-300 hover:text-blue-500 p-1 mr-1"
                              >
                                <ICON_SVG.pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteExpense(item.id)}
                                className="text-gray-300 hover:text-red-400 p-1"
                              >
                                <ICON_SVG.trash className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }
);
export default BudgetSection;
