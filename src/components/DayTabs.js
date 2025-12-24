// src/components/DayTabs.js
import React, { memo } from "react";
// ★ 改用 useTheme，不再引入舊的變數
import { useTheme } from "../utils/theme";
import { getDayInfo } from "../utils/dateUtils";

const DayTabs = memo(({ totalDays, activeDay, setActiveDay, startDate }) => {
  // ★ 取得主題
  const { theme } = useTheme();

  return (
    <div className="flex space-x-2 overflow-x-auto pb-4 mb-6 border-b border-gray-100 scrollbar-hide">
      {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
        // 使用工具函式
        const { dateStr, weekStr } = getDayInfo(startDate, day);

        return (
          <button key={day} onClick={() => setActiveDay(day)} className="...">
            <span className="text-base font-bold">Day {day}</span>
            {dateStr && (
              <span className="text-[10px] opacity-80 font-normal">
                {dateStr} ({weekStr})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
});

export default DayTabs;
