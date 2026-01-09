// src/components/SmartText.js
import React from "react";
import { useTheme } from "../utils/theme";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

const SmartText = ({ text, className = "" }) => {
  const { theme } = useTheme();
  if (!text) return null;

  const lines = String(text).split("\n");

  return (
    <div className={`leading-relaxed ${className}`}>
      {lines.map((line, lineIdx) => {
        const trimmedLine = line.trim();
        
        // 1. 處理空行
        if (trimmedLine === "" && lineIdx !== lines.length - 1) {
          return <div key={lineIdx} className="h-3" />;
        }

        // 2. 處理標題 (# Title)
        if (line.startsWith("# ")) {
          return (
            <h3 key={lineIdx} className={`text-lg font-bold mt-5 mb-2 pb-1 border-b ${theme.accentBorder} ${theme.accentText}`}>
              {line.replace("# ", "")}
            </h3>
          );
        }

        // 3. 處理分隔線 (---)
        if (trimmedLine === "---") {
          return <hr key={lineIdx} className="my-4 border-gray-200" />;
        }

        // 4. 處理清單 (- Item)
        if (line.startsWith("- ")) {
          return (
            <div key={lineIdx} className="flex items-start mb-1.5 ml-1">
              <span className={`mr-2 mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${theme.buttonPrimary}`}></span>
              <span className="text-sm text-gray-700">{renderInline(line.replace("- ", ""))}</span>
            </div>
          );
        }

        // 5. 一般行
        return (
          <p key={lineIdx} className="text-sm mb-1.5 break-all text-gray-700">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
};

// 提取行內解析邏輯 (粗體、連結)
function renderInline(text) {
  const parts = text.split(/(\*\*.*?\*\*|https?:\/\/[^\s]+)/g);
  return parts.map((part, pIdx) => {
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={pIdx} className="font-bold text-slate-900 mx-0.5">{part.slice(2, -2)}</strong>;
    }
    if (part.match(URL_REGEX)) {
      return (
        <a key={pIdx} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 underline transition mx-0.5">
          {part}
        </a>
      );
    }
    return <span key={pIdx}>{part}</span>;
  });
}

export default SmartText;