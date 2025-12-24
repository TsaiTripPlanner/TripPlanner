// src/utils/dateUtils.js
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import "dayjs/locale/zh-tw"; // 繁體中文支援

dayjs.extend(duration);
dayjs.locale("zh-tw");

/**
 * 格式化日期為 "MM/DD (星期幾)"
 * @param {string} startDate - 開始日期 'YYYY-MM-DD'
 * @param {number} dayIndex - 第幾天 (從 1 開始)
 */
export const getDayInfo = (startDate, dayIndex) => {
  if (!startDate) return { dateStr: "", weekStr: "" };

  const targetDate = dayjs(startDate).add(dayIndex - 1, "day");
  return {
    dateStr: targetDate.format("M/D"),
    weekStr: targetDate.format("dd"), // 會顯示 一, 二...
  };
};

/**
 * 計算兩個時間點之間的時長 (例如 "14:00" 到 "16:30")
 * @param {string} start - "HH:mm"
 * @param {string} end - "HH:mm"
 */
export const calculateDuration = (start, end) => {
  if (!start || !end) return "";

  const startTime = dayjs(`2000-01-01 ${start}`);
  let endTime = dayjs(`2000-01-01 ${end}`);

  // 如果結束時間小於開始時間，視為跨日
  if (endTime.isBefore(startTime)) {
    endTime = endTime.add(1, "day");
  }

  const diff = endTime.diff(startTime);
  const dur = dayjs.duration(diff);

  const hours = Math.floor(dur.asHours());
  const minutes = dur.minutes();

  let result = "";
  if (hours > 0) result += `${hours}h`;
  if (minutes > 0) result += ` ${minutes}m`;
  return result.trim();
};

/**
 * 取得今天的日期字串 'YYYY-MM-DD'
 */
export const getTodayStr = () => dayjs().format("YYYY-MM-DD");

/**
 * 行程排序邏輯 (用於 useItineraries)
 */
export const sortItineraries = (trips) => {
  return [...trips].sort((a, b) => {
    const dateA = a.startDate || "0000-00-00";
    const dateB = b.startDate || "0000-00-00";
    return dayjs(dateB).isAfter(dayjs(dateA)) ? 1 : -1;
  });
};
