// src/components/ConfirmModal.js
import React from "react";
import Modal from "./Modal";
import { useTheme } from "../utils/theme";

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "確定刪除",
  isDanger = false, // 如果是危險操作(如刪除)，按鈕會變紅色
}) => {
  const { theme } = useTheme();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        {/* 顯示提示訊息 */}
        <p className="text-gray-600 text-sm leading-relaxed">{message}</p>

        {/* 按鈕區：取消 & 確定 */}
        <div className="flex space-x-3 justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
          >
            取消
          </button>

          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-white rounded-lg text-sm font-medium shadow-sm transition transform active:scale-95 ${
              isDanger
                ? "bg-red-500 hover:bg-red-600" // 危險操作用紅色
                : theme.buttonPrimary // 普通操作用主題色
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
