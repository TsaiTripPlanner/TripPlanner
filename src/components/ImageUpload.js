// src/components/ImageUpload.js
import React, { useState } from "react";
import imageCompression from "browser-image-compression"; // 引入壓縮套件
import { ICON_SVG } from "../utils/icons";
import { getOptimizedImageUrl } from "../utils/imageUtils";

const ImageUpload = ({ onUploadSuccess, currentImage }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);

  // 請將下方兩行替換為你在 Cloudinary 看到的真實資訊
  const CLOUD_NAME = "demuglp1j";
  const UPLOAD_PRESET = "Trip Photo";

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setCompressionProgress(0);

    try {
      // 壓縮設定
      const options = {
        maxSizeMB: 0.8, // 最大檔案大小 (0.8MB)
        maxWidthOrHeight: 1280, // 最大寬度或高度
        useWebWorker: true, // 使用 WebWorker 跑背景執行，不卡住畫面
        onProgress: (progress) => setCompressionProgress(progress), // 顯示進度
      };

      console.log(`原始大小: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

      // 執行壓縮
      const compressedFile = await imageCompression(file, options);

      console.log(
        `壓縮後大小: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`
      );

      // 將壓縮後的 Blob 轉為上傳用的 FormData
      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("upload_preset", UPLOAD_PRESET);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json();

      if (data.secure_url) {
        onUploadSuccess(data.secure_url);
      } else {
        alert("上傳失敗");
      }
    } catch (error) {
      console.error("處理圖片錯誤:", error);
      alert("圖片處理或上傳發生錯誤");
    } finally {
      setIsUploading(false);
      setCompressionProgress(0);
    }
  };

  return (
    <div className="mt-2">
      {currentImage ? (
        <div className="relative inline-block">
          <img
            src={getOptimizedImageUrl(currentImage, 200)}
            alt="Preview"
            className="w-24 h-24 object-cover rounded-lg border-2 border-slate-200"
          />
          <button
            onClick={() => onUploadSuccess("")}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md"
            title="移除圖片"
          >
            <ICON_SVG.xMark className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <label
          className={`flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
            isUploading ? "bg-gray-100 animate-pulse" : ""
          }`}
        >
          <div className="flex flex-col items-center justify-center">
            {isUploading ? (
              <div className="text-center">
                <div className="text-[10px] text-blue-500 font-bold mb-1">
                  {compressionProgress < 100 ? "壓縮中..." : "上傳中..."}
                </div>
                <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${compressionProgress}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              /* ★ 修正點 1: 這裡需要正確的括號閉合 */
              <>
                <ICON_SVG.camera className="w-8 h-8 text-gray-400 mb-1" />
                <p className="text-[10px] text-gray-400 font-bold">上傳圖片</p>
              </>
            )}
          </div> {/* ★ 修正點 2: 這裡閉合內層 div */}
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*"
            disabled={isUploading}
          />
        </label>
      )}
      <p className="text-[9px] text-gray-400 mt-1 ml-1">
        * 圖片將自動壓縮以節省流量
      </p>
    </div>
  );
};

export default ImageUpload;