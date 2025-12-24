// src/components/ImageUpload.js
import React, { useState } from "react";
import { ICON_SVG } from "../utils/icons";

const ImageUpload = ({ onUploadSuccess, currentImage }) => {
  const [isUploading, setIsUploading] = useState(false);

  // 請將下方兩行替換為你在 Cloudinary 看到的真實資訊
  const CLOUD_NAME = "demuglp1j";
  const UPLOAD_PRESET = "Trip Photo";

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 簡單檢查檔案大小 (例如限制 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("檔案太大了，請上傳 5MB 以下的圖片");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
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
        alert("上傳失敗，請檢查 Cloudinary 設定");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("上傳發生錯誤");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mt-2">
      {currentImage ? (
        <div className="relative inline-block">
          <img
            src={currentImage}
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
            isUploading ? "opacity-50" : ""
          }`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <ICON_SVG.camera className="w-8 h-8 text-gray-400 mb-1" />
            <p className="text-[10px] text-gray-400 font-bold">
              {isUploading ? "上傳中..." : "上傳圖片"}
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*"
            disabled={isUploading}
          />
        </label>
      )}
    </div>
  );
};

export default ImageUpload;
