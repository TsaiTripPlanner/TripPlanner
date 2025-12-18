// src/index.js
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "./utils/theme"; // 引入剛剛做好的主題功能

import App from "./App";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    {/* 這裡包起來，App 才能使用換膚功能 */}
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);
