// src/utils/theme.js
import React, { createContext, useContext, useState, useEffect } from "react";

// 這裡定義了兩種風格的顏色
export const THEMES = {
  // 1. 原本的設計 (保留不動)
  morandi: {
    id: "morandi",
    name: "經典莫蘭迪",
    colors: {
      // 這是給 React 用來組裝 class 的關鍵字，例如 border-slate-400
      accent: "slate",
      // 整體背景色 (冷灰白)
      background: "bg-stone-50",
      // 邊框顏色
      accentBorder: "border-slate-400",
      // 強調文字顏色
      accentText: "text-slate-600",
      // 選中的天數按鈕
      selectedDayButton: "bg-slate-500 text-white shadow-lg",
      // 沒選中的天數按鈕
      dayButtonPassive: "bg-stone-200 text-gray-700 hover:bg-slate-100",
      // 主要按鈕 (如建立行程)
      buttonPrimary: "bg-slate-600 hover:bg-slate-700",
      // 下方導覽列 (選中)
      floatingSelectedText: "text-slate-600",
      // 下方導覽列 (沒選中)
      floatingPassiveText: "text-gray-500 hover:text-gray-700",
      // 登入框背景
      loginModalBg: "bg-[#F8F4E8]",
      loginText: "text-[#7D6B55]",
    },
  },
  // 2. 新增：無印良品風 (Muji Style)
  muji: {
    id: "muji",
    name: "無印簡約",
    colors: {
      accent: "stone", // 使用暖石灰色系
      // 背景色：非常淺的米色/棉麻色
      background: "bg-[#F9F8F6]",
      accentBorder: "border-[#A69B95]",
      // 文字：深咖啡灰
      accentText: "text-[#5E544A]",
      // 選中按鈕：無印風的牛皮紙色/深卡其
      selectedDayButton: "bg-[#8E8071] text-white shadow-md",
      dayButtonPassive: "bg-[#EAE8E4] text-[#5E544A] hover:bg-[#DCD6D0]",
      buttonPrimary: "bg-[#8E8071] hover:bg-[#75685B]",
      floatingSelectedText: "text-[#8E8071]",
      floatingPassiveText: "text-[#9E948B] hover:text-[#5E544A]",
      loginModalBg: "bg-[#F2EFE9]",
      loginText: "text-[#5E544A]",
    },
  },
};

// 建立一個 Context (像是一個全域的廣播系統)
const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // 預設使用 'morandi'
  const [currentThemeId, setCurrentThemeId] = useState("morandi");

  const changeTheme = (themeId) => {
    if (THEMES[themeId]) {
      setCurrentThemeId(themeId);
    }
  };

  const value = {
    theme: THEMES[currentThemeId].colors, // 這裡會自動送出當前選中的顏色包
    currentThemeId,
    changeTheme,
    allThemes: Object.values(THEMES),
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// 讓其他檔案可以方便取得顏色的工具
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme 必須被包在 ThemeProvider 裡面");
  }
  return context;
};
