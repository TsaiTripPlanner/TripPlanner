// src/components/ImageUpload.js
import React, { useState } from "react";
import imageCompression from "browser-image-compression";
import { ICON_SVG } from "../utils/icons";
import { getOptimizedImageUrl } from "../utils/imageUtils";

const ImageUpload = ({ onUploadSuccess, currentImages = [] }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const CLOUD_NAME = "demuglp1j";
  const UPLOAD_PRESET = "Trip Photo";

  // 核心上傳邏輯 (支援單張或多張)
  const processAndUploadFiles = async (files) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setProgress(10);

    const uploadPromises = Array.from(files).map(async (file, index) => {
      try {
        // 1. 壓縮
        const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1280, useWebWorker: true };
        const compressedFile = await imageCompression(file, options);
        
        // 2. 上傳到 Cloudinary
        const formData = new FormData();
        formData.append("file", compressedFile);
        formData.append("upload_preset", UPLOAD_PRESET);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        return data.secure_url;
      } catch (err) {
        console.error("上傳失敗:", err);
        return null;
      }
    });

    const urls = await Promise.all(uploadPromises);
    const validUrls = urls.filter(url => url !== null);
    
    // 合併新舊圖片
    onUploadSuccess([...currentImages, ...validUrls]);
    setIsUploading(false);
    setProgress(0);
  };

  // 處理檔案選取
  const handleFileChange = (e) => processAndUploadFiles(e.target.files);

  // 貼上功能 (Ctrl+V)
  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    const files = [];

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        files.push(items[i].getAsFile());
    }
    if (files.length > 0) {
      // 如果貼上的是圖片，攔截預設行為
      e.preventDefault(); 
      e.stopPropagation();
      processAndUploadFiles(files);
    }
    }
  };

  const removeImage = (indexToRemove) => {
    const filtered = currentImages.filter((_, idx) => idx !== indexToRemove);
    onUploadSuccess(filtered);
  };

  return (
    // tabIndex="0" 讓這區塊可以接收貼上事件
    <div className="mt-2 outline-none" onPaste={handlePaste} tabIndex="0">
      {/* 圖片預覽區域 (橫向捲動) */}
      <div className="flex flex-wrap gap-2 mb-2">
        {currentImages.map((url, idx) => (
          <div key={idx} className="relative w-20 h-20 group">
            <img
              src={getOptimizedImageUrl(url, 200)}
              className="w-full h-full object-cover rounded-lg border border-gray-200"
              alt=""
            />
            <button
              onClick={() => removeImage(idx)}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ICON_SVG.xMark className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* 上傳按鈕 */}
        <label className={`w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors ${isUploading ? 'animate-pulse' : ''}`}>
          {isUploading ? (
            <span className="text-[10px] text-blue-500 font-bold">上傳中...</span>
          ) : (
            <>
              <ICON_SVG.plusSmall className="w-6 h-6 text-gray-400" />
              <span className="text-[9px] text-gray-400 font-bold text-center">點擊或貼上</span>
            </>
          )}
          <input type="file" multiple className="hidden" onChange={handleFileChange} accept="image/*" disabled={isUploading} />
        </label>
      </div>
      <p className="text-[9px] text-gray-400 ml-1 italic">* 支援 Ctrl+V 直接貼上截圖</p>
    </div>
  );
};

export default ImageUpload;