// src/utils/constants.js

// 1. 定義分頁 (Tab) 名稱
// 這樣我們就不會手滑把 itinerary 打成 itnerary
export const TABS = {
  ITINERARY: "itinerary",
  PACKING: "packing",
  BUDGET: "budget",
};

// 2. 預設天數選項
export const DEFAULT_DAYS_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10, 14, 30];

// 3. 活動類別定義 (從 App.js 搬過來)
export const ACTIVITY_TYPES = [
  {
    id: "sightseeing",
    name: "景點",
    icon: "camera",
    color: "text-emerald-700",
    bg: "bg-emerald-100",
    border: "border-emerald-200",
  },
  {
    id: "food",
    name: "飲食",
    icon: "food",
    color: "text-amber-700",
    bg: "bg-amber-100",
    border: "border-amber-200",
  },
  {
    id: "transport",
    name: "交通",
    icon: "transport",
    color: "text-slate-600",
    bg: "bg-slate-200",
    border: "border-slate-300",
  },
  {
    id: "accommodation",
    name: "住宿",
    icon: "home",
    color: "text-violet-700",
    bg: "bg-violet-100",
    border: "border-violet-200",
  },
  {
    id: "shopping",
    name: "購物",
    icon: "shopping",
    color: "text-blue-700",
    bg: "bg-blue-100",
    border: "border-blue-200",
  },
  {
    id: "other",
    name: "其他",
    icon: "dots",
    color: "text-stone-600",
    bg: "bg-stone-200",
    border: "border-stone-300",
  },
];

// 4. 預算相關設定 (從 BudgetSection.js 搬過來)
export const CURRENCIES = [
  "TWD",
  "JPY",
  "KRW",
  "USD",
  "EUR",
  "CNY",
  "THB",
  "VND",
];

export const EXPENSE_CATEGORIES = [
  { id: "food", name: "飲食", icon: "food" },
  { id: "transport", name: "交通", icon: "transport" },
  { id: "shopping", name: "購物", icon: "shopping" },
  { id: "accommodation", name: "住宿", icon: "home" },
  { id: "entertainment", name: "娛樂", icon: "ticket" },
  { id: "other", name: "其他", icon: "dots" },
];

export const PAYMENT_METHODS = [
  { id: "cash", name: "現金", icon: "banknotes" },
  { id: "card", name: "刷卡", icon: "creditCard" },
];
