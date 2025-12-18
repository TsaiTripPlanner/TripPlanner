// src/components/ListSection.js
import React, { useState, memo } from "react";
import { ICON_SVG } from "../utils/icons";
import { useTheme } from "../utils/theme";
import ConfirmModal from "./ConfirmModal"; // ★ 1. 引入確認視窗

const ListSection = memo(
  ({
    listCategories,
    newCategoryName,
    setNewCategoryName,
    addCategory,
    updateCategoryName,
    deleteCategory,
    addItemToList,
    updateItemName,
    toggleItemCompletion,
    deleteItem,
    importFromItinerary,
    allItineraries,
    currentItineraryId,
  }) => {
    const { theme } = useTheme();

    const [newItemInput, setNewItemInput] = useState({});
    const [collapsedCategories, setCollapsedCategories] = useState({});
    const [selectedImportId, setSelectedImportId] = useState("");
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editingItemId, setEditingItemId] = useState(null);
    const [tempEditText, setTempEditText] = useState("");

    // ★ 2. 新增：刪除確認的設定狀態 (用來記錄現在要刪誰、是什麼類型)
    const [deleteConfig, setDeleteConfig] = useState(null);

    const handleNewItemChange = (categoryId, value) =>
      setNewItemInput((prev) => ({ ...prev, [categoryId]: value }));

    const handleAddItemPress = (categoryId) => {
      const itemName = newItemInput[categoryId]?.trim();
      if (itemName) {
        addItemToList(categoryId, itemName);
        handleNewItemChange(categoryId, "");
      }
    };

    const toggleCollapse = (categoryId) =>
      setCollapsedCategories((prev) => ({
        ...prev,
        [categoryId]: !prev[categoryId],
      }));

    const startEditCategory = (id, currentName) => {
      setEditingCategoryId(id);
      setTempEditText(currentName);
    };

    const saveEditCategory = (id) => {
      if (tempEditText.trim()) {
        updateCategoryName(id, tempEditText);
      }
      setEditingCategoryId(null);
    };

    const startEditItem = (id, currentName) => {
      setEditingItemId(id);
      setTempEditText(currentName);
    };

    const saveEditItem = (id) => {
      if (tempEditText.trim()) {
        updateItemName(id, tempEditText);
      }
      setEditingItemId(null);
    };

    const handleImport = () => {
      if (!selectedImportId) return;
      if (
        window.confirm(
          "確定要從該行程匯入清單嗎？這將會把所有類別和項目複製過來。"
        )
      ) {
        importFromItinerary(selectedImportId);
        setSelectedImportId("");
      }
    };

    // ★ 3. 新增：處理點擊「刪除分類」
    const handleDeleteCategoryClick = (id, name) => {
      setDeleteConfig({
        type: "category",
        id: id,
        title: "刪除分類",
        message: `確定要刪除「${name}」這個分類嗎？該分類下的所有項目也會一併被刪除。`,
      });
    };

    // ★ 4. 新增：處理點擊「刪除項目」
    const handleDeleteItemClick = (categoryId, itemId, name) => {
      setDeleteConfig({
        type: "item",
        categoryId: categoryId,
        itemId: itemId,
        title: "刪除項目",
        message: `確定要刪除「${name}」嗎？`,
      });
    };

    // ★ 5. 新增：執行刪除 (按下 Modal 的確定後)
    const handleConfirmDelete = () => {
      if (!deleteConfig) return;

      if (deleteConfig.type === "category") {
        deleteCategory(deleteConfig.id);
      } else if (deleteConfig.type === "item") {
        deleteItem(deleteConfig.categoryId, deleteConfig.itemId);
      }

      // 關閉 Modal
      setDeleteConfig(null);
    };

    const availableItineraries =
      allItineraries?.filter((i) => i.id !== currentItineraryId) || [];

    return (
      <div className={`bg-white p-4 sm:p-6 rounded-xl shadow-lg`}>
        <div className="flex justify-between items-center mb-4">
          <h2
            className={`text-xl font-bold flex items-center ${theme.accentText}`}
          >
            <ICON_SVG.clipboardCheck
              className={`w-6 h-6 mr-2 ${theme.accentText}`}
            />
            清單管理
          </h2>
        </div>

        {availableItineraries.length > 0 && (
          <div
            className={`mb-6 p-4 ${theme.infoBoxBg} border ${theme.infoBoxBorder} rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm`}
          >
            <div
              className={`flex items-center text-sm ${theme.infoBoxText} font-medium`}
            >
              <ICON_SVG.listCollapse
                className={`w-5 h-5 mr-2 ${theme.infoBoxText}`}
              />
              <span>從其他行程匯入清單：</span>
            </div>
            <div className="flex w-full sm:w-auto gap-2">
              <select
                value={selectedImportId}
                onChange={(e) => setSelectedImportId(e.target.value)}
                className="flex-grow sm:w-56 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-slate-500 focus:border-slate-500 bg-white text-gray-700"
              >
                <option value="">-- 請選擇來源行程 --</option>
                {availableItineraries.map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    {trip.title}
                  </option>
                ))}
              </select>
              <button
                onClick={handleImport}
                disabled={!selectedImportId}
                className={`px-4 py-1.5 text-white text-sm rounded-md shadow-sm whitespace-nowrap transition disabled:opacity-50 disabled:cursor-not-allowed ${theme.buttonPrimary}`}
              >
                匯入
              </button>
            </div>
          </div>
        )}

        <div
          className={`mb-8 p-4 ${theme.infoBoxBg} rounded-lg border ${theme.infoBoxBorder} flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4`}
        >
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
            className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base focus:ring-slate-500 focus:border-slate-500"
          />
          <button
            onClick={addCategory}
            disabled={!newCategoryName.trim()}
            className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-md text-white ${theme.buttonPrimary} disabled:opacity-50 transition`}
          >
            <ICON_SVG.plusSmall className="w-5 h-5 inline-block -mt-0.5 mr-1" />{" "}
            新增類別
          </button>
        </div>

        <div className="space-y-8">
          {listCategories.length === 0 ? (
            <div
              className={`text-center py-8 ${theme.infoBoxText} ${theme.itemRowBg} rounded-lg`}
            >
              <p>目前沒有任何清單類別。</p>
            </div>
          ) : (
            listCategories.map((category) => {
              const isCollapsed = collapsedCategories[category.id];
              const itemsCompleted = category.items.filter(
                (i) => i.isCompleted
              ).length;
              const isEditingCat = editingCategoryId === category.id;

              return (
                <div
                  key={category.id}
                  className="border border-gray-200 rounded-xl shadow-md overflow-hidden bg-white"
                >
                  <div
                    className={`p-3 flex justify-between items-center ${theme.categoryHeaderBg}`}
                  >
                    {isEditingCat ? (
                      <div className="flex items-center flex-grow space-x-2 mr-2">
                        <input
                          autoFocus
                          type="text"
                          value={tempEditText}
                          onChange={(e) => setTempEditText(e.target.value)}
                          className="flex-grow px-2 py-1 border border-gray-300 rounded text-base"
                        />
                        <button
                          onClick={() => saveEditCategory(category.id)}
                          className="text-green-600 p-1"
                        >
                          <ICON_SVG.check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setEditingCategoryId(null)}
                          className="text-gray-500 p-1"
                        >
                          <ICON_SVG.xMark className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => toggleCollapse(category.id)}
                        className="flex items-center flex-grow text-left focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-opacity-50 p-1 -m-1 rounded-md"
                      >
                        <h3
                          className={`text-lg font-semibold flex items-center ${theme.accentText}`}
                        >
                          <ICON_SVG.bookmark className="w-5 h-5 mr-2 flex-shrink-0" />
                          {category.name} ({itemsCompleted}/
                          {category.items.length})
                        </h3>
                        <span
                          className={`ml-3 transition-transform duration-300 ${theme.infoBoxText}`}
                        >
                          {isCollapsed ? (
                            <ICON_SVG.chevronDown className="w-5 h-5" />
                          ) : (
                            <ICON_SVG.chevronUp className="w-5 h-5" />
                          )}
                        </span>
                      </button>
                    )}

                    <div className="flex items-center">
                      {!isEditingCat && (
                        <button
                          onClick={() =>
                            startEditCategory(category.id, category.name)
                          }
                          className={`hover:text-blue-500 transition p-1 rounded hover:bg-white flex-shrink-0 ml-1 ${theme.infoBoxText}`}
                        >
                          <ICON_SVG.pencil className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        // ★ 6. 修改：點擊垃圾桶時，呼叫新的確認函式
                        onClick={() =>
                          handleDeleteCategoryClick(category.id, category.name)
                        }
                        className={`hover:text-red-500 transition p-1 rounded hover:bg-white flex-shrink-0 ml-1 ${theme.infoBoxText}`}
                      >
                        <ICON_SVG.trash className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {!isCollapsed && (
                    <ul className="divide-y divide-gray-200 bg-white">
                      {category.items.map((item) => {
                        const isEditingItem = editingItemId === item.id;
                        return (
                          <li
                            key={item.id}
                            className={`p-3 flex justify-between items-center transition hover:bg-gray-50`}
                          >
                            {isEditingItem ? (
                              <div className="flex items-center flex-grow space-x-2 mr-2">
                                <input
                                  autoFocus
                                  type="text"
                                  value={tempEditText}
                                  onChange={(e) =>
                                    setTempEditText(e.target.value)
                                  }
                                  className="flex-grow px-2 py-1 border border-gray-300 rounded text-base"
                                />
                                <button
                                  onClick={() => saveEditItem(item.id)}
                                  className="text-green-600 p-1"
                                >
                                  <ICON_SVG.check className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => setEditingItemId(null)}
                                  className="text-gray-500 p-1"
                                >
                                  <ICON_SVG.xMark className="w-5 h-5" />
                                </button>
                              </div>
                            ) : (
                              <label className="flex items-center space-x-3 cursor-pointer flex-grow min-w-0">
                                <input
                                  type="checkbox"
                                  checked={item.isCompleted}
                                  onChange={(e) =>
                                    toggleItemCompletion(
                                      item.id,
                                      e.target.checked
                                    )
                                  }
                                  className={`form-checkbox h-5 w-5 ${theme.accentText} rounded transition duration-150 ease-in-out border-gray-300 focus:ring-slate-500 flex-shrink-0`}
                                />
                                <span
                                  className={`text-base flex-grow min-w-0 truncate ${
                                    item.isCompleted
                                      ? "line-through text-gray-400"
                                      : theme.itemRowText
                                  }`}
                                >
                                  {item.name}
                                </span>
                              </label>
                            )}

                            <div className="flex items-center">
                              {!isEditingItem && (
                                <button
                                  onClick={() =>
                                    startEditItem(item.id, item.name)
                                  }
                                  className={`hover:text-blue-500 transition ml-2 flex-shrink-0 ${theme.itemMetaText}`}
                                >
                                  <ICON_SVG.pencil className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                // ★ 7. 修改：點擊項目垃圾桶時，呼叫確認函式
                                onClick={() =>
                                  handleDeleteItemClick(
                                    category.id,
                                    item.id,
                                    item.name
                                  )
                                }
                                className={`hover:text-red-400 transition ml-2 flex-shrink-0 ${theme.itemMetaText}`}
                              >
                                <ICON_SVG.trash className="w-4 h-4" />
                              </button>
                            </div>
                          </li>
                        );
                      })}

                      <li className={`p-3 ${theme.itemInputBg}`}>
                        <div className="flex space-x-2 items-center">
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
                            className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base focus:ring-slate-500 focus:border-slate-500 min-w-0"
                          />
                          <button
                            onClick={() => handleAddItemPress(category.id)}
                            disabled={!newItemInput[category.id]?.trim()}
                            className={`flex-shrink-0 p-2 rounded-md text-white ${theme.buttonPrimary} disabled:opacity-50 transition`}
                          >
                            <ICON_SVG.plusSmall className="w-6 h-6" />
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

        {/* ★ 8. 加入確認視窗 */}
        <ConfirmModal
          isOpen={!!deleteConfig}
          onClose={() => setDeleteConfig(null)}
          onConfirm={handleConfirmDelete}
          title={deleteConfig?.title}
          message={deleteConfig?.message}
          confirmText="刪除"
          isDanger={true}
        />
      </div>
    );
  }
);
export default ListSection;
