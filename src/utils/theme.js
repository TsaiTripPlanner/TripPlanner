// src/utils/theme.js
import React, { createContext, useContext, useState } from "react";

export const THEMES = {
  // 1. 經典莫蘭迪
  morandi: {
    id: "morandi",
    name: "經典莫蘭迪",
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

      // 卡片配色
      cardBg: "bg-white",
      cardBorder: "border-gray-200",
      cardTitle: "text-slate-700",
      cardMeta: "text-slate-500",
      cardMetaLight: "text-slate-400",
      cardDesc: "text-slate-600",

      // 時間軸
      timelineLine: "bg-gray-300",
      timelineDotPassive: "bg-gray-400",

      // 資訊框配色
      infoBoxBg: "bg-slate-100",
      infoBoxBorder: "border-slate-200",
      infoBoxText: "text-slate-600",

      // ★★★ 新增：清單與費用項目的配色 (莫蘭迪)
      categoryHeaderBg: "bg-slate-100", // 類別標題背景
      itemRowBg: "bg-gray-50", // 項目背景
      itemRowText: "text-gray-700", // 項目文字
      itemInputBg: "bg-gray-100", // 輸入框背景
    },
  },
  // 2. 無印簡約
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

      // 卡片配色
      cardBg: "bg-[#FAF9F6]",
      cardBorder: "border-[#C5BDB5]",
      cardTitle: "text-[#594A3C]",
      cardMeta: "text-[#998B82]",
      cardMetaLight: "text-[#B0A69E]",
      cardDesc: "text-[#6E6359]",

      // 時間軸
      timelineLine: "bg-[#C5BDB5]",
      timelineDotPassive: "bg-[#A69B95]",

      // 資訊框配色
      // ★ 調亮：從 E2DED6 改成 EAE6DE (更柔和的淺亞麻色)
      infoBoxBg: "bg-[#EAE6DE]",
      infoBoxBorder: "border-[#C5BDB5]",
      infoBoxText: "text-[#5E544A]",

      // ★★★ 新增：清單與費用項目的配色 (無印風)
      categoryHeaderBg: "bg-[#EAE6DE]", // 類別標題 (同資訊框)
      itemRowBg: "bg-[#F7F5F2]", // 項目背景 (極淺的暖白)
      itemRowText: "text-[#5E544A]", // 項目文字 (中褐灰)
      itemInputBg: "bg-[#EAE6DE]", // 輸入框背景 (淺亞麻)
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
    throw new Error("useTheme 必須被包在 ThemeProvider 裡面");
  }
  return context;
};
