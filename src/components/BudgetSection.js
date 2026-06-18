// src/components/BudgetSection.js
import React, { useState, memo } from "react";
import { ICON_SVG } from "../utils/icons";
import { useTheme } from "../utils/theme";
import { CURRENCIES, EXPENSE_CATEGORIES } from "../utils/constants";
import ConfirmModal from "./ConfirmModal";
import { useBudget } from "../hooks/useBudget";

const BudgetSection = memo(
  ({ itineraryId, userId, totalDays, itineraryStartDate, travelerCount }) => {
    const { theme } = useTheme();
    const count = travelerCount || 1;

    const {
      expenses,
      totals,
      groupedExpenses,
      sortedDays,
      addExpense,
      updateExpense,
      deleteExpense,
    } = useBudget(userId, itineraryId, travelerCount);

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

    const handleAddExpense = async () => {
      if (!newItem.title.trim() || newItem.amount === "") return;
      try {
        await addExpense(newItem);
        setNewItem({ ...newItem, title: "", amount: "", description: "" });
      } catch (e) {
        alert("新增失敗");
      }
    };

    const handleSaveEdit = async (id) => {
      if (!editData.title.trim() || editData.amount === "") return;
      try {
        await updateExpense(id, editData);
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

    return (
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
        {/* ...標題、頂部匯總、輸入區的 JSX 完全不變... */}

        {/* 費用清單區，原本的 sortedDays.map(...) 完全不變，
            只需要把按鈕的 onClick 改名： */}

        {/* 編輯模式儲存按鈕 */}
        <button
          onClick={() => handleSaveEdit(item.id)}
          className="bg-green-500 text-white p-2 rounded shadow-sm active:scale-95 transition"
        >
          <ICON_SVG.check className="w-5 h-5" />
        </button>

        {/* 新增記帳按鈕 */}
        <button
          onClick={handleAddExpense}
          className={`shrink-0 px-4 py-2 text-white rounded text-sm font-bold shadow-sm ${theme.buttonPrimary}`}
        >
          記帳
        </button>

        <ConfirmModal
          isOpen={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={async () => {
            try {
              await deleteExpense(deleteConfirmId);
            } catch (e) {
              alert("刪除失敗");
            } finally {
              setDeleteConfirmId(null);
            }
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