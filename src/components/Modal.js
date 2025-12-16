// src/components/Modal.js
import React from "react";
import { ICON_SVG } from "../utils/icons";
import { morandiAccentText } from "../utils/theme";

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* 
         修復重點 1：外層容器改用 Flexbox 
         - items-center: 垂直置中 (解決一片灰的問題)
         - justify-center: 水平置中
         - p-4: 手機版四周留白 (解決超出線外、貼邊的問題)
      */}
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        {/* 背景遮罩 */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* 
           修復重點 2：Modal 本體
           - w-full: 手機版寬度佔滿 (但會被上面的 p-4 擋住不貼邊)
           - max-w-lg: 電腦版限制最大寬度
           - relative: 確保浮在遮罩上面
        */}
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all w-full max-w-lg sm:my-8">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3
                className={`text-lg leading-6 font-medium text-gray-900 ${morandiAccentText}`}
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
