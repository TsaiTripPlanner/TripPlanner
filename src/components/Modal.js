// src/components/Modal.js
import React from "react";
import { ICON_SVG } from "../utils/icons";
import { useTheme } from "../utils/theme"; // ★ 改用 useTheme

const Modal = ({ isOpen, onClose, title, children }) => {
  const { theme } = useTheme(); // ★ 取得 theme

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all w-full max-w-lg sm:my-8">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3
                // ★ 這裡使用 theme.accentText
                className={`text-lg leading-6 font-medium text-gray-900 ${theme.accentText}`}
              >
                {title}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <ICON_SVG.xClose className="w-6 h-6" />
              </button>
            </div>
            <div className="mt-4">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
