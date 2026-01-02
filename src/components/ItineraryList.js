// src/components/ItineraryList.js
import React from "react";
import { ICON_SVG } from "../utils/icons";
import { useTheme } from "../utils/theme";
import { useTheme } from "../utils/theme";
import ItineraryCard from "./ItineraryCard";

const ItineraryList = ({
  allItineraries,
  onSelect,
  onDelete,
  onEdit,
  onOpenCreateModal,
}) => {
  const { theme, currentThemeId } = useTheme();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        {/* 現在它會自動繼承外層的顏色 (theme.textMain) 和字體 (theme.font) */}
        <h1 className={`text-4xl flex items-center ${currentThemeId === 'muji' ? 'muji-title-bold' : 'font-medium'}`}>
          <img
            src="/world_761505.jpg"
            alt="Logo"
            className="w-12 h-12 object-contain mr-3"
          />
          旅遊
        </h1>
        <button
          onClick={onOpenCreateModal}
          className={`flex items-center px-4 py-2 rounded-lg text-white shadow-md ${theme.buttonPrimary} transition transform hover:scale-105`}
        >
          <ICON_SVG.plusSmall className="w-5 h-5 mr-1" /> 建立新旅程
        </button>
      </div>

      <div className="flex flex-col space-y-4">
        {allItineraries.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
            <p className="text-gray-500 mb-4">目前還沒有任何行程規劃</p>
            <button
              onClick={onOpenCreateModal}
              className="text-slate-600 font-medium hover:underline"
            >
              立即建立第一個旅程
            </button>
          </div>
        ) : (
          allItineraries.map((trip) => (
            <ItineraryCard
              key={trip.id}
              data={trip}
              onSelect={onSelect}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ItineraryList;
