// src/components/DayTabs.js
import React, { memo } from "react";
// ★ 改用 useTheme，不再引入舊的變數
import { useTheme } from "../utils/theme";
import { getDayInfo } from "../utils/dateUtils";

// 輔助函式：計算第 N 天是幾月幾號以及星期幾
const getDayInfo = (startDate, dayIndex) => {
  if (!startDate) return { dateStr: "", weekStr: "" };

  const date = new Date(startDate);
  date.setDate(date.getDate() + (dayIndex - 1));

  // 取得日期字串 (例如 12/20)
  const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

  // 取得星期字串 (例如 "五")
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
  const weekStr = weekDays[date.getDay()];

  return { dateStr, weekStr };
};

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
