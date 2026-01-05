// src/utils/imageUtils.js
export const getOptimizedImageUrl = (url, width = 800) => {
  if (!url || typeof url !== 'string') return url;
  
  if (url.includes('cloudinary.com')) {
    // f_auto: 自動格式, q_auto: 自動品質, w: 寬度, dpr_auto: 像素密度適配
    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},dpr_auto,c_scale/`);
  }
  
  return url;
};