// src/components/SmartText.js
import React from "react";
import { useTheme } from "../utils/theme";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

const SmartText = ({ text, className = "" }) => {
  const { theme } = useTheme();

  if (!text) return null;

  // 1. 先處理換行，將文字切成每一行
  const lines = String(text).split("\n");

  return (
    <div className={`leading-relaxed ${className}`}>
      {lines.map((line, lineIdx) => {
        // 處理空行
        if (line.trim() === "" && lineIdx !== lines.length - 1) {
          return <div key={lineIdx} className="h-2" />;
        }

        // 2. 處理標題 (Markdown: # Title)
        if (line.startsWith("# ")) {
          return (
            <h3
              key={lineIdx}
              className={`text-lg font-bold mt-4 mb-2 pb-1 border-b ${theme.accentBorder} ${theme.accentText}`}
            >
              {line.replace("# ", "")}
            </h3>
          );
        }

        // 3. 處理行內格式 (粗體與網址)
        // 我們先用 Regex 將行內文字切碎
        const parts = line.split(/(\*\*.*?\*\*|https?:\/\/[^\s]+)/g);

        return (
          <p key={lineIdx} className="text-sm mb-1 break-all">
            {parts.map((part, pIdx) => {
              if (!part) return null;

              // 處理粗體 (Markdown: **bold**)
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong key={pIdx} className="font-bold text-slate-900 mx-0.5">
                    {part.slice(2, -2)}
                  </strong>
                );
              }

              // 處理網址連結
              if (part.match(URL_REGEX)) {
                return (
                  <a
                    key={pIdx}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 underline transition mx-0.5"
                  >
                    {part}
                  </a>
                );
              }

              // 一般文字
              return <span key={pIdx}>{part}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
};

export default SmartText;