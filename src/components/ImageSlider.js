// src/components/ImageSlider.js
import React, { useState } from "react";
import { ICON_SVG } from "../utils/icons";
import { getOptimizedImageUrl } from "../utils/imageUtils";

const ImageSlider = ({ 
  urls, 
  onView, 
  aspect = "aspect-video", // 預設 16:9
  objectFit = "object-cover" // 預設裁切填滿
}) => {
  const [index, setIndex] = useState(0);

  // 確保 urls 永遠是陣列，且過濾掉無效值
  const images = Array.isArray(urls) ? urls.filter(Boolean) : (urls ? [urls] : []);

  if (images.length === 0) return null;

  const next = (e) => {
    e.stopPropagation();
    setIndex((prev) => (prev + 1) % images.length);
  };

  const prev = (e) => {
    e.stopPropagation();
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className={`relative group w-full overflow-hidden rounded-lg bg-gray-100 ${aspect}`}>
      <img
        src={getOptimizedImageUrl(images[index], 1200)}
        alt={`圖片 ${index + 1}`}
        className={`w-full h-full transition-all duration-300 ${objectFit} cursor-pointer`}
        onClick={() => onView ? onView(images[index]) : window.open(images[index])}
      />

      {images.length > 1 && (
        <>
          {/* 左箭頭 */}
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
          >
            <ICON_SVG.arrowLeft className="w-5 h-5" />
          </button>
          
          {/* 右箭頭 */}
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
          >
            <div className="rotate-180">
              <ICON_SVG.arrowLeft className="w-5 h-5" />
            </div>
          </button>

          {/* 頁碼指示器 */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
            {index + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
};

export default ImageSlider;