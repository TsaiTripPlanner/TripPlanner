// src/utils/dateUtils.js
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import "dayjs/locale/zh-tw";

dayjs.extend(duration);
dayjs.locale("zh-tw");

export const getDayInfo = (startDate, dayIndex) => {
  if (!startDate) return { dateStr: "", weekStr: "" };
  const targetDate = dayjs(startDate).add(dayIndex - 1, "day");
  return {
    dateStr: targetDate.format("M/D"),
    weekStr: targetDate.format("dd"),
  };
};

export const calculateDuration = (start, end) => {
  // 如果開始或結束有一個沒填，就不顯示持續時間
  if (!start || !end) return "";

  try {
    const startTime = dayjs(`2000-01-01 ${start}`);
    let endTime = dayjs(`2000-01-01 ${end}`);

    if (!startTime.isValid() || !endTime.isValid()) return "";

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
  } catch (e) {
    return "";
  }
};

export const getTodayStr = () => dayjs().format("YYYY-MM-DD");

export const sortItineraries = (trips) => {
  return [...trips].sort((a, b) => {
    const dateA = a.startDate || "0000-00-00";
    const dateB = b.startDate || "0000-00-00";
    return dayjs(dateB).isAfter(dayjs(dateA)) ? 1 : -1;
  });
};
