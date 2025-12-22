// src/utils/theme.js
import React, { createContext, useContext, useState } from "react";

export const THEMES = {
  morandi: {
    id: "morandi",
    name: "莫蘭迪",
    colors: {
      accent: "slate",
      ringFocus: "focus:ring-slate-500",
      borderFocus: "focus:border-slate-500",
      spinnerBorder: "border-slate-500",
      accentRing: "ring-slate-400",
      accentHoverText: "hover:text-slate-600",
      accentRingLight: "ring-slate-300",
      accentBorderHover: "hover:border-slate-300",
      background: "bg-stone-50",
      accentBorder: "border-slate-400",
      accentText: "text-slate-600",
      selectedDayButton: "bg-slate-500 text-white shadow-lg",
      dayButtonPassive: "bg-stone-200 text-gray-700 hover:bg-slate-100",
      buttonPrimary: "bg-slate-600 hover:bg-slate-700",
      floatingSelectedText: "text-slate-600",
      floatingPassiveText: "text-gray-500 hover:text-gray-700",
      loginModalBg: "bg-[#FCF9F2]",
      loginText: "text-[#7D6B55]",
      font: "font-cute",
      textMain: "text-slate-600",
      cardBg: "bg-white",
      cardBorder: "border-gray-200",
      cardTitle: "text-slate-700",
      cardMeta: "text-slate-500",
      cardMetaLight: "text-slate-400",
      cardDesc: "text-slate-600",
      timelineLine: "bg-gray-300",
      timelineDotPassive: "bg-gray-400",
      infoBoxBg: "bg-slate-100",
      infoBoxBorder: "border-slate-200",
      infoBoxText: "text-slate-600",
      categoryHeaderBg: "bg-slate-100",
      itemRowBg: "bg-gray-50",
      itemRowText: "text-gray-700",
      itemMetaText: "text-gray-400",
      itemInputBg: "bg-gray-100",
    },
  },
  muji: {
    id: "muji",
    name: "無印簡約",
    colors: {
      accent: "stone",
      ringFocus: "focus:ring-stone-500",
      borderFocus: "focus:border-stone-500",
      spinnerBorder: "border-stone-500",
      accentRing: "ring-stone-400",
      accentHoverText: "hover:text-stone-600",
      accentRingLight: "ring-stone-300",
      accentBorderHover: "hover:border-stone-300",
      background: "bg-[#EFECE6]",
      accentBorder: "border-[#8C8279]",
      accentText: "text-[#8C6A5D]",
      selectedDayButton: "bg-[#8E8071] text-white shadow-md",
      dayButtonPassive: "bg-[#DCD6D0] text-[#5E544A] hover:bg-[#C8C2BC]",
      buttonPrimary: "bg-[#8E8071] hover:bg-[#6B5F52]",
      floatingSelectedText: "text-[#8E8071]",
      floatingPassiveText: "text-[#9E948B] hover:text-[#5E544A]",
      loginModalBg: "bg-[#F2EFE9]",
      loginText: "text-[#5E544A]",
      font: "font-zen-kaku font-light",
      textMain: "text-[#5E544A]",
      cardBg: "bg-[#FAF9F6]",
      cardBorder: "border-[#C5BDB5]",
      cardTitle: "text-[#594A3C]",
      cardMeta: "text-[#7A6E64]", // 從淺褐灰色變為深褐灰色
      cardMetaLight: "text-[#8E8071]",
      cardDesc: "text-[#6E6359]",
      timelineLine: "bg-[#C5BDB5]",
      timelineDotPassive: "bg-[#A69B95]",
      infoBoxBg: "bg-[#F5F3EF]",
      infoBoxBorder: "border-[#D6CEC5]",
      infoBoxText: "text-[#5E544A]",
      categoryHeaderBg: "bg-[#F5F3EF]",
      itemRowBg: "bg-white",
      itemRowText: "text-[#594A3C]",
      itemMetaText: "text-[#9E948B]",
      itemInputBg: "bg-[#F5F3EF]",
    },
  },
};

const ThemeContext = createContext();
export const ThemeProvider = ({ children }) => {
  const [currentThemeId, setCurrentThemeId] = useState("morandi");
  const changeTheme = (themeId) => {
    if (THEMES[themeId]) setCurrentThemeId(themeId);
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
export const useTheme = () => useContext(ThemeContext);
