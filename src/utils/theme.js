// src/utils/theme.js
import React, { createContext, useContext, useState } from "react";

export const THEMES = {
  // 1. 經典莫蘭迪
  morandi: {
    id: "morandi",
    name: "莫蘭迪",
    colors: {
      accent: "slate",
      background: "bg-stone-50",
      accentBorder: "border-slate-400",
      accentText: "text-slate-600",
      selectedDayButton: "bg-slate-500 text-white shadow-lg",
      dayButtonPassive: "bg-stone-200 text-gray-700 hover:bg-slate-100",
      buttonPrimary: "bg-slate-600 hover:bg-slate-700",
      floatingSelectedText: "text-slate-600",
      floatingPassiveText: "text-gray-500 hover:text-gray-700",
      loginModalBg: "bg-[#F8F4E8]",
      loginText: "text-[#7D6B55]",
      font: "font-cute",
      textMain: "text-slate-600",

      // 卡片
      cardBg: "bg-white",
      cardBorder: "border-gray-200",
      cardTitle: "text-slate-700",
      cardMeta: "text-slate-500",
      cardMetaLight: "text-slate-400",
      cardDesc: "text-slate-600",

      // 時間軸
      timelineLine: "bg-gray-300",
      timelineDotPassive: "bg-gray-400",

      // 資訊框 (匯入、總支出)
      infoBoxBg: "bg-slate-100",
      infoBoxBorder: "border-slate-200",
      infoBoxText: "text-slate-600",

      // 列表項目 (清單、費用)
      categoryHeaderBg: "bg-slate-100",
      itemRowBg: "bg-gray-50",
      itemRowText: "text-gray-700",
      itemMetaText: "text-gray-400", // 次要文字 (幣別/圖示)
      itemInputBg: "bg-gray-100",
    },
  },
  // 2. 無印簡約 (調整版)
  muji: {
    id: "muji",
    name: "無印簡約",
    colors: {
      accent: "stone",
      background: "bg-[#EFECE6]",
      accentBorder: "border-[#8C8279]",
      accentText: "text-[#8C6A5D]",
      selectedDayButton: "bg-[#8E8071] text-white shadow-md",
      dayButtonPassive: "bg-[#DCD6D0] text-[#5E544A] hover:bg-[#C8C2BC]",
      buttonPrimary: "bg-[#8E8071] hover:bg-[#6B5F52]",
      floatingSelectedText: "text-[#8E8071]",
      floatingPassiveText: "text-[#9E948B] hover:text-[#5E544A]",
      loginModalBg: "bg-[#E6E2D8]",
      loginText: "text-[#5E544A]",
      font: "font-sans-tc",
      textMain: "text-[#5E544A]",

      // 卡片
      cardBg: "bg-[#FAF9F6]",
      cardBorder: "border-[#C5BDB5]",
      cardTitle: "text-[#594A3C]",
      cardMeta: "text-[#998B82]",
      cardMetaLight: "text-[#B0A69E]",
      cardDesc: "text-[#6E6359]",

      // 時間軸
      timelineLine: "bg-[#C5BDB5]",
      timelineDotPassive: "bg-[#A69B95]",

      // ★★★ 資訊框調亮 (從深灰變成極淺暖灰)
      infoBoxBg: "bg-[#F5F3EF]", // 很淺的米色
      infoBoxBorder: "border-[#D6CEC5]", // 邊框維持
      infoBoxText: "text-[#5E544A]", // 咖啡色文字

      // ★★★ 列表項目
      categoryHeaderBg: "bg-[#F5F3EF]", // 跟資訊框一樣
      itemRowBg: "bg-white", // 項目背景改純白，比較乾淨
      itemRowText: "text-[#594A3C]", // 深咖啡色 (標題)
      itemMetaText: "text-[#9E948B]", // 淺咖啡色 (幣別/圖示)
      itemInputBg: "bg-[#F5F3EF]",
    },
  },
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [currentThemeId, setCurrentThemeId] = useState("morandi");

  const changeTheme = (themeId) => {
    if (THEMES[themeId]) {
      setCurrentThemeId(themeId);
    }
  };

  const value = {
    theme: THEMES[currentThemeId].colors,
    currentThemeId,
    changeTheme,
    allThemes: Object.values(THEMES),
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
