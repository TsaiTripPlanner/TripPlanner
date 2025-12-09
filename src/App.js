import React, { useState, useEffect, useCallback, memo, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

// 原本的 Firebase 功能引入要留著 (除了 initializeApp 和 getFirestore)
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
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

const DEFAULT_DAYS_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10, 14, 30];
const CURRENCIES = ["TWD", "JPY", "KRW", "USD", "EUR", "CNY", "THB", "VND"];
const EXPENSE_CATEGORIES = [
  { id: "food", name: "飲食", icon: "food" },
  { id: "transport", name: "交通", icon: "transport" },
  { id: "shopping", name: "購物", icon: "shopping" },
  { id: "accommodation", name: "住宿", icon: "home" },
  { id: "entertainment", name: "娛樂", icon: "ticket" },
  { id: "other", name: "其他", icon: "dots" },
];

const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const renderDescriptionWithLinks = (text) => {
  if (!text) return null;
  const parts = text.split(URL_REGEX);
  return parts.map((part, index) => {
    if (!part) return null;
    if (part.match(URL_REGEX))
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-700 underline break-all transition"
        >
          {part}
        </a>
      );
    else return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

const calculateDuration = (start, end) => {
  if (!start || !end) return "";
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const totalStartMinutes = startHour * 60 + startMinute;
  let totalEndMinutes = endHour * 60 + endMinute;
  let durationMinutes = totalEndMinutes - totalStartMinutes;
  if (durationMinutes < 0) durationMinutes += 24 * 60;
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  let durationString = "";
  if (hours > 0) durationString += `${hours}小時`;
  if (minutes > 0) durationString += ` ${minutes}分鐘`;
  return durationString;
};

// --- ActivityItem 元件 ---
const ActivityItem = memo(
  ({
    activity,
    onDelete,
    onStartEdit,
    isEditing,
    editData,
    onEditChange,
    onSaveEdit,
    onCancelEdit,
    dragHandleProps,
    isDragging,
  }) => {
    const cardClasses = `bg-white rounded-xl shadow-lg p-4 transition-all ${
      isEditing
        ? "shadow-xl ring-2 ring-opacity-50 ring-slate-500"
        : isDragging
        ? "shadow-2xl ring-2 ring-slate-300 rotate-1"
        : "hover:shadow-xl"
    } border-l-4 ${morandiAccentBorder}`;

    const duration = calculateDuration(activity.startTime, activity.endTime);
    const timeDisplay = activity.startTime ? activity.startTime : "未定";
    const inputField = (name, label, type = "text") => (
      <div className="mb-2">
        <label
          htmlFor={`edit-${name}-${activity.id}`}
          className="block text-xs font-medium text-gray-500"
        >
          {label}
        </label>
        <input
          type={type}
          id={`edit-${name}-${activity.id}`}
          name={name}
          value={editData[name] || ""}
          onChange={onEditChange}
          className="mt-1 block w-full px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-slate-500 focus:border-slate-500"
          required={name === "title" || name === "location"}
        />
      </div>
    );

    return (
      <div className="flex relative h-full">
        <div className="w-20 text-right flex-shrink-0 pr-4 pt-0.5 hidden sm:block">
          <div
            className={`text-lg font-bold ${morandiAccentText} leading-snug`}
          >
            {timeDisplay}
          </div>
          {duration && (
            <div className="text-xs text-gray-500 mt-0.5 whitespace-nowrap">
              ({duration})
            </div>
          )}
        </div>
        <div className="flex flex-col items-center pt-1 flex-shrink-0 mr-4 sm:mr-0">
          <div
            className={`w-3 h-3 rounded-full ${
              activity.isCompleted ? morandiSelectedDayButton : "bg-gray-400"
            } flex-shrink-0`}
          ></div>
          <div className="flex-grow w-px bg-gray-300"></div>
        </div>
        <div
          className={`flex-grow min-w-0 ${!isEditing ? "sm:ml-4" : "sm:ml-0"}`}
        >
          <div className={cardClasses}>
            {isEditing ? (
              <div>
                <h4 className={`text-lg font-bold mb-3 ${morandiAccentText}`}>
                  編輯活動
                </h4>
                {inputField("title", "標題")}
                {inputField("location", "地點")}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {inputField("startTime", "開始時間", "time")}
                  {inputField("endTime", "結束時間", "time")}
                </div>
                <div className="mb-3">
                  <label
                    htmlFor={`edit-description-${activity.id}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    詳細說明
                  </label>
                  <textarea
                    id={`edit-description-${activity.id}`}
                    name="description"
                    value={editData.description || ""}
                    onChange={onEditChange}
                    rows="4"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-slate-500 focus:border-slate-500"
                  ></textarea>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={onCancelEdit}
                    type="button"
                    className="text-gray-600 bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-md text-sm font-medium flex items-center transition"
                  >
                    <ICON_SVG.xMark className="w-4 h-4 mr-1" /> 取消
                  </button>
                  <button
                    onClick={() => onSaveEdit(activity.id)}
                    type="button"
                    className="text-white bg-slate-600 hover:bg-slate-700 px-3 py-1 rounded-md text-sm font-medium flex items-center transition"
                  >
                    <ICON_SVG.check className="w-4 h-4 mr-1" /> 儲存
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start">
                <div className="flex-grow min-w-0">
                  <h3 className="text-lg font-bold text-gray-800 truncate leading-snug">
                    {activity.title}
                  </h3>
                  {(activity.startTime || activity.endTime) && (
                    <h4 className="text-sm font-semibold text-gray-400 mb-1">
                      {activity.startTime || "?"} ~ {activity.endTime || "?"}
                    </h4>
                  )}
                  <p className="flex items-center text-xs text-gray-500 mt-1">
                    <ICON_SVG.mapPin
                      className={`w-3 h-3 mr-1 ${morandiAccentText} flex-shrink-0`}
                    />
                    <span className="truncate">{activity.location}</span>
                  </p>
                  {activity.description && (
                    <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                      {renderDescriptionWithLinks(activity.description)}
                    </p>
                  )}
                </div>
                <div className="flex flex-col space-y-2 flex-shrink-0 ml-4 pt-1">
                  <div className="flex space-x-1 justify-end">
                    <button
                      onClick={() => onStartEdit(activity)}
                      className={`text-gray-400 hover:text-${morandiAccentColor}-600 transition p-1`}
                    >
                      {" "}
                      <ICON_SVG.pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDelete(activity.id)}
                      className="text-gray-400 hover:text-red-500 transition p-1"
                    >
                      {" "}
                      <ICON_SVG.trash className="w-5 h-5" />
                    </button>
                  </div>
                  <div
                    {...dragHandleProps}
                    className="flex items-center justify-center p-2 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing hover:bg-gray-100 rounded transition"
                  >
                    <ICON_SVG.menu className="w-6 h-6" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

const ListSection = memo(
  ({
    listCategories,
    newCategoryName,
    setNewCategoryName,
    addCategory,
    deleteCategory,
    addItemToList,
    toggleItemCompletion,
    deleteItem,
    morandiAccentText,
    morandiButtonPrimary,
    morandiAccentColor,
  }) => {
    const [newItemInput, setNewItemInput] = useState({});
    const [collapsedCategories, setCollapsedCategories] = useState({});
    const handleNewItemChange = (categoryId, value) =>
      setNewItemInput((prev) => ({ ...prev, [categoryId]: value }));
    const handleAddItemPress = (categoryId) => {
      const itemName = newItemInput[categoryId]?.trim();
      if (itemName) {
        addItemToList(categoryId, itemName);
        handleNewItemChange(categoryId, "");
      }
    };
    const totalItems = listCategories.reduce(
      (acc, cat) => acc + cat.items.length,
      0
    );
    const completedItems = listCategories.reduce(
      (acc, cat) => acc + cat.items.filter((item) => item.isCompleted).length,
      0
    );
    const completionPercentage =
      totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    const toggleCollapse = (categoryId) =>
      setCollapsedCategories((prev) => ({
        ...prev,
        [categoryId]: !prev[categoryId],
      }));

    return (
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center">
          <ICON_SVG.clipboardCheck
            className={`w-6 h-6 mr-2 ${morandiAccentText}`}
          />
          清單管理 ({completedItems}/{totalItems} - {completionPercentage}%)
        </h2>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
          <div
            className={`h-2.5 rounded-full ${morandiButtonPrimary.replace(
              "bg-slate",
              "bg-slate"
            )}`}
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        <div className="mb-8 p-4 bg-stone-50 rounded-lg border border-stone-200 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <input
            type="text"
            placeholder="輸入新類別名稱 (如: 服飾, 藥品)"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCategory();
              }
            }}
            className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-slate-500 focus:border-slate-500"
          />
          <button
            onClick={addCategory}
            disabled={!newCategoryName.trim()}
            className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-md text-white ${morandiButtonPrimary} disabled:opacity-50 transition`}
          >
            <ICON_SVG.plusSmall className="w-5 h-5 inline-block -mt-0.5 mr-1" />{" "}
            新增類別
          </button>
        </div>
        <div className="space-y-8">
          {listCategories.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
              <p>目前沒有任何清單類別。</p>
            </div>
          ) : (
            listCategories.map((category) => {
              const isCollapsed = collapsedCategories[category.id];
              const itemsRemaining = category.items.filter(
                (i) => !i.isCompleted
              ).length;
              return (
                <div
                  key={category.id}
                  className="border border-gray-200 rounded-xl shadow-md overflow-hidden bg-gray-50"
                >
                  <div
                    className={`p-3 flex justify-between items-center ${
                      morandiAccentColor === "slate"
                        ? "bg-slate-100"
                        : "bg-gray-200"
                    }`}
                  >
                    <button
                      onClick={() => toggleCollapse(category.id)}
                      className="flex items-center flex-grow text-left focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-opacity-50 p-1 -m-1 rounded-md"
                    >
                      <h3
                        className={`text-lg font-semibold flex items-center ${morandiAccentText}`}
                      >
                        <ICON_SVG.bookmark className="w-5 h-5 mr-2 flex-shrink-0" />
                        {category.name} ({itemsRemaining}/
                        {category.items.length})
                      </h3>
                      <span className="ml-3 text-gray-500 transition-transform duration-300">
                        {isCollapsed ? (
                          <ICON_SVG.chevronDown className="w-5 h-5" />
                        ) : (
                          <ICON_SVG.chevronUp className="w-5 h-5" />
                        )}
                      </span>
                    </button>
                    <button
                      onClick={() => deleteCategory(category.id)}
                      className="text-gray-400 hover:text-red-500 transition p-1 rounded hover:bg-white flex-shrink-0 ml-3"
                    >
                      <ICON_SVG.trash className="w-5 h-5" />
                    </button>
                  </div>
                  {!isCollapsed && (
                    <ul className="divide-y divide-gray-200 bg-white">
                      {category.items.map((item) => (
                        <li
                          key={item.id}
                          className="p-3 flex justify-between items-center hover:bg-gray-50 transition"
                        >
                          <label className="flex items-center space-x-3 cursor-pointer flex-grow min-w-0">
                            <input
                              type="checkbox"
                              checked={item.isCompleted}
                              onChange={(e) =>
                                toggleItemCompletion(
                                  category.id,
                                  item.id,
                                  e.target.checked
                                )
                              }
                              className={`form-checkbox h-5 w-5 ${morandiAccentText} rounded transition duration-150 ease-in-out border-gray-300 focus:ring-slate-500`}
                            />
                            <span
                              className={`text-gray-800 text-base flex-grow min-w-0 truncate ${
                                item.isCompleted
                                  ? "line-through text-gray-400"
                                  : ""
                              }`}
                            >
                              {item.name}
                            </span>
                          </label>
                          <button
                            onClick={() => deleteItem(category.id, item.id)}
                            className="text-gray-300 hover:text-red-400 transition ml-3 flex-shrink-0"
                          >
                            <ICON_SVG.trash className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                      <li className="p-3 bg-gray-100">
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            placeholder="新增項目名稱"
                            value={newItemInput[category.id] || ""}
                            onChange={(e) =>
                              handleNewItemChange(category.id, e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddItemPress(category.id);
                              }
                            }}
                            className="flex-grow px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-slate-500 focus:border-slate-500"
                          />
                          <button
                            onClick={() => handleAddItemPress(category.id)}
                            disabled={!newItemInput[category.id]?.trim()}
                            className={`flex-shrink-0 px-3 py-1 text-sm font-medium rounded-md text-white ${morandiButtonPrimary} disabled:opacity-50 transition`}
                          >
                            {" "}
                            +{" "}
                          </button>
                        </div>
                      </li>
                    </ul>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }
);

// ★★★ BudgetSection (旅行費用) 組件 - 修正版：移除後端排序以避免索引問題 ★★★
const BudgetSection = memo(
  ({
    itineraryId,
    userId,
    morandiAccentText,
    morandiButtonPrimary,
    totalDays,
    itineraryStartDate,
  }) => {
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
                  第 {d} 天
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
                      第 {dayKey} 天{" "}
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
                                    第 {d} 天
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

const App = () => {
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState("itinerary");
  const [activeDay, setActiveDay] = useState(1);
  const [activities, setActivities] = useState([]);

  const [itineraryId, setItineraryId] = useState(null);
  const [allItineraries, setAllItineraries] = useState([]);

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
  const [listCategories, setListCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const itemUnsubscribersRef = useRef([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const currentItinerary = allItineraries.find((i) => i.id === itineraryId);
  const [currentTitle, setCurrentTitle] = useState("");
  const [totalDays, setTotalDays] = useState(6);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");

  useEffect(() => {
    if (!auth) {
      setErrorMessage("Firebase Config 尚未設定或錯誤。");
      setIsAuthReady(true);
      setIsLoading(false);
      return;
    }
    signInAnonymously(auth).catch((error) => {
      console.error("認證失敗:", error);
      setErrorMessage("登入失敗，請檢查 Firebase Auth 設定。");
    });
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : "guest");
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !userId || !db) return;

    // 讀取行程列表
    const itinerariesColRef = collection(
      db,
      `artifacts/${appId}/users/${userId}/itineraries`
    );
    const q = query(itinerariesColRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const trips = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        trips.sort((a, b) => {
          const dateA =
            a.startDate ||
            (a.createdAt
              ? new Date(a.createdAt.seconds * 1000).toISOString().split("T")[0]
              : "0000-00-00");
          const dateB =
            b.startDate ||
            (b.createdAt
              ? new Date(b.createdAt.seconds * 1000).toISOString().split("T")[0]
              : "0000-00-00");
          return dateB.localeCompare(dateA);
        });

        setAllItineraries(trips);
        setIsLoading(false);
      },
      (error) => {
        console.error("讀取行程列表失敗", error);
        setErrorMessage(error.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAuthReady, userId]);

  useEffect(() => {
    if (currentItinerary) {
      setCurrentTitle(currentItinerary.title);
      setTotalDays(currentItinerary.durationDays || 6);
      setActiveDay(1);
    }
  }, [currentItinerary]);

  const createItinerary = async () => {
    if (!newItineraryData.title.trim()) return;
    try {
      const itinerariesColRef = collection(
        db,
        `artifacts/${appId}/users/${userId}/itineraries`
      );
      await addDoc(itinerariesColRef, {
        title: newItineraryData.title.trim(),
        durationDays: Number(newItineraryData.days),
        startDate: newItineraryData.startDate,
        createdAt: serverTimestamp(),
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
      const itineraryRef = doc(
        db,
        `artifacts/${appId}/users/${userId}/itineraries/${editingItineraryData.id}`
      );
      await updateDoc(itineraryRef, {
        title: editingItineraryData.title.trim(),
        durationDays: Number(editingItineraryData.days),
        startDate: editingItineraryData.startDate,
        updatedAt: serverTimestamp(),
      });
      setIsEditItineraryModalOpen(false);
    } catch (error) {
      console.error("更新失敗:", error);
      alert("更新失敗: " + error.message);
    }
  };

  const deleteItineraryFromList = async (id) => {
    if (!window.confirm("確定要永久刪除此行程及其所有資料嗎？")) return;
    try {
      const activitiesRef = collection(
        db,
        `artifacts/${appId}/users/${userId}/itineraries/${id}/activities`
      );
      const actSnap = await getDocs(activitiesRef);
      const batch = writeBatch(db);
      actSnap.docs.forEach((doc) => batch.delete(doc.ref));

      const catsRef = collection(
        db,
        `artifacts/${appId}/users/${userId}/itineraries/${id}/listCategories`
      );
      const catSnap = await getDocs(catsRef);
      catSnap.docs.forEach((doc) => batch.delete(doc.ref));

      batch.delete(
        doc(db, `artifacts/${appId}/users/${userId}/itineraries`, id)
      );
      await batch.commit();
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
      const itineraryRef = doc(
        db,
        `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}`
      );
      await updateDoc(itineraryRef, {
        title: tempTitle.trim(),
        updatedAt: serverTimestamp(),
      });
      setIsEditingTitle(false);
    } catch (error) {
      console.error("更新標題失敗:", error);
      alert("更新標題失敗");
    }
  };

  useEffect(() => {
    if (activeTab !== "itinerary" || !itineraryId || !db) return;
    const activitiesColRef = collection(
      db,
      `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/activities`
    );
    const q = query(activitiesColRef, where("day", "==", activeDay));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      data.sort(
        (a, b) =>
          (a.order !== undefined ? a.order : 9999) -
          (b.order !== undefined ? b.order : 9999)
      );
      setActivities(data);
    });
    return () => unsubscribe();
  }, [itineraryId, activeDay, userId, activeTab]);

  useEffect(() => {
    if (!itineraryId || !db) return;
    const categoriesColRef = collection(
      db,
      `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/listCategories`
    );
    itemUnsubscribersRef.current.forEach((unsub) => unsub());
    itemUnsubscribersRef.current = [];
    const unsubscribeCategories = onSnapshot(
      categoriesColRef,
      (categorySnapshot) => {
        const categoriesData = [];
        categorySnapshot.docs.forEach((catDoc) => {
          const category = { id: catDoc.id, ...catDoc.data(), items: [] };
          categoriesData.push(category);
          const itemsColRef = collection(
            db,
            `${categoriesColRef.path}/${category.id}/items`
          );
          const unsubscribeItems = onSnapshot(itemsColRef, (itemSnapshot) => {
            const items = itemSnapshot.docs.map((itemDoc) => ({
              id: itemDoc.id,
              ...itemDoc.data(),
            }));
            setListCategories((prev) => {
              const updated = prev.map((pCat) =>
                pCat.id === category.id
                  ? {
                      ...pCat,
                      items: items.sort(
                        (a, b) =>
                          a.createdAt?.seconds - b.createdAt?.seconds || 0
                      ),
                    }
                  : pCat
              );
              return updated.sort(
                (a, b) =>
                  (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
              );
            });
          });
          itemUnsubscribersRef.current.push(unsubscribeItems);
        });
        setListCategories(
          categoriesData.sort(
            (a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
          )
        );
      }
    );
    return () => {
      unsubscribeCategories();
      itemUnsubscribersRef.current.forEach((unsub) => unsub());
    };
  }, [itineraryId, userId]);

  const handleNewActivityChange = useCallback((e) => {
    setNewActivity((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError("");
  }, []);

  const addActivity = useCallback(
    async (e) => {
      e.preventDefault();
      if (!itineraryId) return;
      const { title, location, startTime, endTime, description } = newActivity;
      if (!title.trim() || !location.trim()) {
        setFormError("活動標題與地點為必填欄位！");
        return;
      }
      try {
        const activitiesColPath = `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/activities`;
        const newOrder = activities.length;
        await addDoc(collection(db, activitiesColPath), {
          title,
          location,
          startTime: startTime || "",
          endTime: endTime || "",
          description: description || "",
          day: activeDay,
          order: newOrder,
          isCompleted: false,
          createdAt: serverTimestamp(),
        });
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
    [itineraryId, userId, newActivity, activeDay, activities.length]
  );

  const handleEditInputChange = useCallback(
    (e) =>
      setEditFormData((prev) => ({ ...prev, [e.target.name]: e.target.value })),
    []
  );

  const deleteActivity = useCallback(
    async (activityId) => {
      if (!itineraryId) return;
      try {
        await deleteDoc(
          doc(
            db,
            `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/activities/${activityId}`
          )
        );
      } catch (error) {
        console.error(error);
      }
    },
    [itineraryId, userId]
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
      if (!itineraryId) return;
      const { title, location, startTime, endTime, description } = editFormData;
      try {
        await updateDoc(
          doc(
            db,
            `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/activities/${activityId}`
          ),
          {
            title,
            location,
            startTime,
            endTime,
            description: description || "",
            updatedAt: serverTimestamp(),
          }
        );
        cancelEdit();
      } catch (error) {
        console.error(error);
      }
    },
    [itineraryId, userId, editFormData, cancelEdit]
  );

  const handleDragEnd = useCallback(
    async (result) => {
      if (!result.destination) return;
      const { source, destination } = result;
      if (source.index === destination.index) return;
      const reorderedActivities = Array.from(activities);
      const [movedItem] = reorderedActivities.splice(source.index, 1);
      reorderedActivities.splice(destination.index, 0, movedItem);
      setActivities(reorderedActivities);
      if (!itineraryId) return;
      try {
        const batch = writeBatch(db);
        reorderedActivities.forEach((act, index) => {
          if (act.order !== index) {
            const ref = doc(
              db,
              `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/activities/${act.id}`
            );
            batch.update(ref, { order: index });
          }
        });
        await batch.commit();
      } catch (error) {
        console.error("拖曳更新失敗:", error);
        alert("排序更新失敗，請檢查網路連線");
      }
    },
    [activities, itineraryId, userId]
  );

  const addCategory = useCallback(async () => {
    if (!itineraryId || !newCategoryName.trim()) return;
    try {
      await addDoc(
        collection(
          db,
          `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/listCategories`
        ),
        { name: newCategoryName.trim(), createdAt: serverTimestamp() }
      );
      setNewCategoryName("");
    } catch (error) {
      console.error(error);
    }
  }, [itineraryId, userId, newCategoryName]);

  const deleteCategory = useCallback(
    async (categoryId) => {
      if (!itineraryId) return;
      if (!window.confirm("確定刪除？")) return;
      try {
        const categoryDocPath = `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/listCategories/${categoryId}`;
        const itemsColRef = collection(db, `${categoryDocPath}/items`);
        const snapshot = await getDocs(itemsColRef);
        await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
        await deleteDoc(doc(db, categoryDocPath));
      } catch (error) {
        console.error(error);
      }
    },
    [itineraryId, userId]
  );

  const addItemToList = useCallback(
    async (categoryId, itemName) => {
      if (!itineraryId || !itemName.trim()) return;
      try {
        await addDoc(
          collection(
            db,
            `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/listCategories/${categoryId}/items`
          ),
          {
            name: itemName.trim(),
            isCompleted: false,
            createdAt: serverTimestamp(),
          }
        );
      } catch (error) {
        console.error(error);
      }
    },
    [itineraryId, userId]
  );

  const toggleItemCompletion = useCallback(
    async (categoryId, itemId, isCompleted) => {
      if (!itineraryId) return;
      try {
        await updateDoc(
          doc(
            db,
            `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/listCategories/${categoryId}/items/${itemId}`
          ),
          { isCompleted: isCompleted, updatedAt: serverTimestamp() }
        );
      } catch (error) {
        console.error(error);
      }
    },
    [itineraryId, userId]
  );

  const deleteItem = useCallback(
    async (categoryId, itemId) => {
      if (!itineraryId) return;
      try {
        await deleteDoc(
          doc(
            db,
            `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/listCategories/${categoryId}/items/${itemId}`
          )
        );
      } catch (error) {
        console.error(error);
      }
    },
    [itineraryId, userId]
  );

  if (isLoading && !errorMessage)
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
                  onDelete={deleteItineraryFromList}
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
              <div className="flex space-x-2 overflow-x-auto pb-4 mb-6 border-b border-gray-200 scrollbar-hide">
                {Array.from({ length: totalDays }, (_, i) => i + 1).map(
                  (day) => (
                    <button
                      key={day}
                      onClick={() => setActiveDay(day)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                        activeDay === day
                          ? morandiSelectedDayButton
                          : morandiDayButtonPassive
                      }`}
                    >
                      第 {day} 天
                    </button>
                  )
                )}
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-6">
                第 {activeDay} 天的活動
              </h3>
              <div className="relative mb-10">
                {activities.length > 0 ? (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="activities-list">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-0"
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
                                  className="mb-8"
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
              addCategory={addCategory}
              deleteCategory={deleteCategory}
              addItemToList={addItemToList}
              toggleItemCompletion={toggleItemCompletion}
              deleteItem={deleteItem}
              morandiAccentText={morandiAccentText}
              morandiButtonPrimary={morandiButtonPrimary}
              morandiAccentColor={morandiAccentColor}
            />
          )}

          {activeTab === "budget" && (
            <BudgetSection
              itineraryId={itineraryId}
              userId={userId}
              morandiAccentText={morandiAccentText}
              morandiButtonPrimary={morandiButtonPrimary}
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
        title={`新增活動 (第 ${activeDay} 天)`}
      >
        <form onSubmit={addActivity} className="space-y-4">
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
            onClick={createItinerary}
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
