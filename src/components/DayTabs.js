// src/components/DayTabs.js
import React, { memo } from "react";
import { useTheme } from "../utils/theme";
import { getDayInfo } from "../utils/dateUtils";

const DayTabs = memo(({ totalDays, activeDay, setActiveDay, startDate }) => {
  const { theme } = useTheme();

  return (
    <div className="flex space-x-2 overflow-x-auto pb-4 mb-6 border-b border-gray-100 scrollbar-hide">
      {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
        // 使用工具函式取得日期與星期
        const { dateStr, weekStr } = getDayInfo(startDate, day);

        return (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 flex flex-col items-center justify-center min-w-[4.5rem] gap-1.5 ${
              activeDay === day
                ? theme.selectedDayButton
                : theme.dayButtonPassive
            }`}
          >
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
