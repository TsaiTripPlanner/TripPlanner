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

// 3. 活動類別定義 (直接使用色票 Hex Code)
export const ACTIVITY_TYPES = [
  {
    id: "sightseeing",
    name: "景點",
    icon: "camera",
    // 迷霧藍綠系
    // Bg: #AAC9CE (淺) -> Border: #7DA3AA (中) -> Text: #3E5C63 (深)
    color: "text-[#3E5C63]",
    bg: "bg-[#AAC9CE]",
    border: "border-[#7DA3AA]",
  },
  {
    id: "food",
    name: "飲食",
    icon: "food",
    // 奶油杏色系
    // Bg: #F8F4E8 (淺) -> Border: #DEC9B5 (中) -> Text: #7D6B55 (深)
    color: "text-[#7D6B55]",
    bg: "bg-[#F8F4E8]",
    border: "border-[#DEC9B5]",
  },
  {
    id: "transport",
    name: "交通",
    icon: "transport",
    // 冷調雲灰系
    // Bg: #CFD9E1 (淺) -> Border: #A4B6C4 (中) -> Text: #536878 (深)
    color: "text-[#536878]",
    bg: "bg-[#CFD9E1]",
    border: "border-[#A4B6C4]",
  },
  {
    id: "accommodation",
    name: "住宿",
    icon: "home",
    // 煙燻紫灰系
    // Bg: #CBBFD3 (淺) -> Border: #B0A0BD (中) -> Text: #615269 (深)
    color: "text-[#615269]",
    bg: "bg-[#CBBFD3]",
    border: "border-[#B0A0BD]",
  },
  {
    id: "shopping",
    name: "購物",
    icon: "shopping",
    // 薄荷灰綠系
    // Bg: #D1E8E0 (淺) -> Border: #9CC4B9 (中) -> Text: #466960 (深)
    color: "text-[#466960]",
    bg: "bg-[#D1E8E0]",
    border: "border-[#9CC4B9]",
  },
  {
    id: "other",
    name: "其他",
    icon: "dots",
    // 暖岩灰系
    // Bg: #E6DFD9 (淺) -> Border: #C9BFB8 (中) -> Text: #6E6259 (深)
    color: "text-[#6E6259]",
    bg: "bg-[#E6DFD9]",
    border: "border-[#C9BFB8]",
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
