// src/components/SpotDetailModal.js
import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import SmartText from "./SmartText";
import { ICON_SVG } from "../utils/icons";
import { getOptimizedImageUrl } from "../utils/imageUtils";
import { SPOT_SUB_TABS, parseSpotContent } from "../utils/referenceUtils";

const SpotDetailModal = ({ viewingDetail, onClose, theme }) => {
  const [activeSpotTab, setActiveSpotTab] = useState('info');

  // 當切換看不同的景點時，重置分頁到「介紹」
  useEffect(() => {
    if (viewingDetail) {
      setActiveSpotTab('info');
    }
  }, [viewingDetail]);

  if (!viewingDetail) return null;

  const spotSections = parseSpotContent(viewingDetail.description || "");

  return (
    <Modal 
      isOpen={!!viewingDetail} 
      onClose={onClose} 
      title={viewingDetail.title || "景點詳情"}
    >
      <div className="flex flex-col min-h-[400px] max-h-[75vh] overflow-hidden bg-white">
        {/* 1. 頂部大圖 */}
        {viewingDetail.imageUrl && (
          <div className="shrink-0 h-44 sm:h-52 overflow-hidden rounded-xl shadow-sm mb-4">
            <img 
              src={getOptimizedImageUrl(viewingDetail.imageUrl, 1600)} 
              className="w-full h-full object-cover cursor-zoom-in" 
              alt="景點大圖" 
              onClick={() => window.open(viewingDetail.imageUrl)}
            />
          </div>
        )}

        {/* 2. 子分頁導覽列 */}
        <div className="flex space-x-1 py-2 overflow-x-auto scrollbar-hide border-b border-gray-100 bg-white sticky top-0 z-20 shrink-0">
          {SPOT_SUB_TABS.map(tab => {
            const isSelected = activeSpotTab === tab.id;
            // 檢查該分頁是否有內容（讓使用者知道哪邊有資料）
            const hasContent = spotSections[tab.id] && spotSections[tab.id].trim().length > 0;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSpotTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
                  isSelected 
                    ? `${theme.buttonPrimary} text-white shadow-md` 
                    : `${hasContent ? 'text-gray-600' : 'text-gray-300'} bg-gray-50`
                }`}
              >
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* 3. 內容顯示區域 */}
        <div className="flex-grow overflow-y-auto mt-2 pt-2 pb-12 px-1 scrollbar-hide">
          {spotSections[activeSpotTab] ? (
            <div className="animate-fade-in px-2">
              <SmartText text={spotSections[activeSpotTab]} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-gray-300">
              <ICON_SVG.noteText className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm italic font-medium">這個分頁目前沒有紀錄</p>
            </div>
          )}
          
          {/* 如果是介紹分頁且有網址，顯示官網按鈕 */}
          {activeSpotTab === 'info' && viewingDetail.url && (
            <a 
              href={viewingDetail.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-6 flex items-center justify-center w-full py-3 bg-slate-800 text-white rounded-xl text-sm font-bold shadow-lg"
            >
              <ICON_SVG.link className="w-4 h-4 mr-2" /> 前往官方網站 / 更多資訊
            </a>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SpotDetailModal;