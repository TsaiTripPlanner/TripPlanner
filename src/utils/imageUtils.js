// src/utils/imageUtils.js
export const getOptimizedImageUrl = (url, width = 800) => {
  if (!url || typeof url !== 'string') return url;
  
  if (url.includes('cloudinary.com')) {
    const requestWidth = Math.round(width * 1.5); 
    return url.replace(
        '/upload/', 
        `/upload/f_auto,q_auto:good,w_${requestWidth},c_scale/`
    );
  }
  
  return url;
};