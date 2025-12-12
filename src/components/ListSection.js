// src/components/ListSection.js
import React, { useState, memo } from "react";
import { ICON_SVG } from "../utils/icons";
import {
  morandiAccentText,
  morandiButtonPrimary,
  morandiAccentColor,
} from "../utils/theme";

// --- 清單管理 (ListSection) 組件 ---
const ListSection = memo(
  ({
    listCategories,
    newCategoryName,
    setNewCategoryName,
    addCategory,
    deleteCategory,
    addItemToList,
    toggleItemCompletion,
    deleteItem,
  }) => {
    const [newItemInput, setNewItemInput] = useState({});
    const [collapsedCategories, setCollapsedCategories] = useState({});
    const handleNewItemChange = (categoryId, value) =>
      setNewItemInput((prev) => ({ ...prev, [categoryId]: value }));
    const handleAddItemPress = (categoryId) => {
      const itemName = newItemInput[categoryId]?.trim();
      if (itemName) {
        addItemToList(categoryId, itemName);
        handleNewItemChange(categoryId, "");
      }
    };
    const totalItems = listCategories.reduce(
      (acc, cat) => acc + cat.items.length,
      0
    );
    const completedItems = listCategories.reduce(
      (acc, cat) => acc + cat.items.filter((item) => item.isCompleted).length,
      0
    );
    const completionPercentage =
      totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    const toggleCollapse = (categoryId) =>
      setCollapsedCategories((prev) => ({
        ...prev,
        [categoryId]: !prev[categoryId],
      }));

    return (
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center">
          <ICON_SVG.clipboardCheck
            className={`w-6 h-6 mr-2 ${morandiAccentText}`}
          />
          清單管理 ({completedItems}/{totalItems} - {completionPercentage}%)
        </h2>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
          <div
            className={`h-2.5 rounded-full ${morandiButtonPrimary.replace(
              "bg-slate",
              "bg-slate"
            )}`}
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        <div className="mb-8 p-4 bg-stone-50 rounded-lg border border-stone-200 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <input
            type="text"
            placeholder="輸入新類別名稱 (如: 服飾, 藥品)"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCategory();
              }
            }}
            className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-slate-500 focus:border-slate-500"
          />
          <button
            onClick={addCategory}
            disabled={!newCategoryName.trim()}
            className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-md text-white ${morandiButtonPrimary} disabled:opacity-50 transition`}
          >
            <ICON_SVG.plusSmall className="w-5 h-5 inline-block -mt-0.5 mr-1" />{" "}
            新增類別
          </button>
        </div>
        <div className="space-y-8">
          {listCategories.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
              <p>目前沒有任何清單類別。</p>
            </div>
          ) : (
            listCategories.map((category) => {
              const isCollapsed = collapsedCategories[category.id];
              const itemsRemaining = category.items.filter(
                (i) => !i.isCompleted
              ).length;
              return (
                <div
                  key={category.id}
                  className="border border-gray-200 rounded-xl shadow-md overflow-hidden bg-gray-50"
                >
                  <div
                    className={`p-3 flex justify-between items-center ${
                      morandiAccentColor === "slate"
                        ? "bg-slate-100"
                        : "bg-gray-200"
                    }`}
                  >
                    <button
                      onClick={() => toggleCollapse(category.id)}
                      className="flex items-center flex-grow text-left focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-opacity-50 p-1 -m-1 rounded-md"
                    >
                      <h3
                        className={`text-lg font-semibold flex items-center ${morandiAccentText}`}
                      >
                        <ICON_SVG.bookmark className="w-5 h-5 mr-2 flex-shrink-0" />
                        {category.name} ({itemsRemaining}/
                        {category.items.length})
                      </h3>
                      <span className="ml-3 text-gray-500 transition-transform duration-300">
                        {isCollapsed ? (
                          <ICON_SVG.chevronDown className="w-5 h-5" />
                        ) : (
                          <ICON_SVG.chevronUp className="w-5 h-5" />
                        )}
                      </span>
                    </button>
                    <button
                      onClick={() => deleteCategory(category.id)}
                      className="text-gray-400 hover:text-red-500 transition p-1 rounded hover:bg-white flex-shrink-0 ml-3"
                    >
                      <ICON_SVG.trash className="w-5 h-5" />
                    </button>
                  </div>
                  {!isCollapsed && (
                    <ul className="divide-y divide-gray-200 bg-white">
                      {category.items.map((item) => (
                        <li
                          key={item.id}
                          className="p-3 flex justify-between items-center hover:bg-gray-50 transition"
                        >
                          <label className="flex items-center space-x-3 cursor-pointer flex-grow min-w-0">
                            <input
                              type="checkbox"
                              checked={item.isCompleted}
                              onChange={(e) =>
                                toggleItemCompletion(
                                  category.id,
                                  item.id,
                                  e.target.checked
                                )
                              }
                              className={`form-checkbox h-5 w-5 ${morandiAccentText} rounded transition duration-150 ease-in-out border-gray-300 focus:ring-slate-500`}
                            />
                            <span
                              className={`text-gray-800 text-base flex-grow min-w-0 truncate ${
                                item.isCompleted
                                  ? "line-through text-gray-400"
                                  : ""
                              }`}
                            >
                              {item.name}
                            </span>
                          </label>
                          <button
                            onClick={() => deleteItem(category.id, item.id)}
                            className="text-gray-300 hover:text-red-400 transition ml-3 flex-shrink-0"
                          >
                            <ICON_SVG.trash className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                      <li className="p-3 bg-gray-100">
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            placeholder="新增項目名稱"
                            value={newItemInput[category.id] || ""}
                            onChange={(e) =>
                              handleNewItemChange(category.id, e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddItemPress(category.id);
                              }
                            }}
                            className="flex-grow px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-slate-500 focus:border-slate-500"
                          />
                          <button
                            onClick={() => handleAddItemPress(category.id)}
                            disabled={!newItemInput[category.id]?.trim()}
                            className={`flex-shrink-0 px-3 py-1 text-sm font-medium rounded-md text-white ${morandiButtonPrimary} disabled:opacity-50 transition`}
                          >
                            {" "}
                            +{" "}
                          </button>
                        </div>
                      </li>
                    </ul>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }
);
export default ListSection;
