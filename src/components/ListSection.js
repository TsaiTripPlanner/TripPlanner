// src/components/ListSection.js
import React, { useState, memo } from "react";
import { ICON_SVG } from "../utils/icons";
import { useTheme } from "../utils/theme";
import ConfirmModal from "./ConfirmModal";

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

    const handleImport = () => {
      if (!selectedImportId) return;
      if (window.confirm("確定要匯入清單嗎？")) {
        importFromItinerary(selectedImportId);
        setSelectedImportId("");
      }
    };
    const handleDeleteCategoryClick = (id, name) =>
      setDeleteConfig({
        type: "category",
        id,
        title: "刪除分類",
        message: `確定要刪除「${name}」嗎？`,
      });
    const handleDeleteItemClick = (categoryId, itemId, name) =>
      setDeleteConfig({
        type: "item",
        categoryId,
        itemId,
        title: "刪除項目",
        message: `確定要刪除「${name}」嗎？`,
      });

    const handleConfirmDelete = () => {
      if (!deleteConfig) return;
      if (deleteConfig.type === "category") deleteCategory(deleteConfig.id);
      else deleteItem(deleteConfig.categoryId, deleteConfig.itemId);
      setDeleteConfig(null);
    };

    const availableItineraries =
      allItineraries?.filter((i) => i.id !== currentItineraryId) || [];

    return (
      <div className={`bg-white p-4 sm:p-6 rounded-xl shadow-lg`}>
        <h2
          className={`text-xl font-bold flex items-center mb-4 ${theme.accentText}`}
        >
          <ICON_SVG.clipboardCheck className="w-6 h-6 mr-2" /> 清單管理
        </h2>

        {/* 匯入功能 */}
        {availableItineraries.length > 0 && (
          <div
            className={`mb-6 p-4 ${theme.infoBoxBg} border ${theme.infoBoxBorder} rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm`}
          >
            <div
              className={`flex items-center text-sm ${theme.infoBoxText} font-medium`}
            >
              匯入清單：
            </div>
            <div className="flex w-full sm:w-auto gap-2">
              <select
                value={selectedImportId}
                onChange={(e) => setSelectedImportId(e.target.value)}
                className={`flex-grow sm:w-56 px-3 py-1.5 border border-gray-300 rounded-md text-sm ${theme.ringFocus} ${theme.borderFocus} bg-white text-gray-700`}
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
                className={`px-4 py-1.5 text-white text-sm rounded-md shadow-sm ${theme.buttonPrimary}`}
              >
                匯入
              </button>
            </div>
          </div>
        )}

        {/* 新增類別 */}
        <div
          className={`mb-8 p-4 ${theme.infoBoxBg} rounded-lg border ${theme.infoBoxBorder} flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4`}
        >
          <input
            type="text"
            placeholder="輸入新類別名稱"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCategory();
              }
            }}
            className={`flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base ${theme.ringFocus} ${theme.borderFocus}`}
          />
          <button
            onClick={addCategory}
            className={`px-4 py-2 text-sm font-medium rounded-md text-white ${theme.buttonPrimary}`}
          >
            新增類別
          </button>
        </div>

        <div className="space-y-8">
          {listCategories.map((category) => {
            const isCollapsed = collapsedCategories[category.id];
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
                    /* === 類別編輯模式：強化按鈕視覺 === */
                    <div className="flex items-center w-full space-x-2">
                      <input
                        autoFocus
                        type="text"
                        value={tempEditText}
                        onChange={(e) => setTempEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            updateCategoryName(category.id, tempEditText);
                            setEditingCategoryId(null);
                          }
                        }}
                        className={`flex-grow min-w-0 px-2 py-2 border border-gray-300 rounded text-base ${theme.ringFocus} ${theme.borderFocus}`}
                      />
                      <button
                        onClick={() => {
                          updateCategoryName(category.id, tempEditText);
                          setEditingCategoryId(null);
                        }}
                        className="bg-green-500 text-white shrink-0 p-2 rounded-md shadow-sm active:scale-95"
                      >
                        <ICON_SVG.check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setEditingCategoryId(null)}
                        className="bg-gray-200 text-gray-600 shrink-0 p-2 rounded-md shadow-sm active:scale-95"
                      >
                        <ICON_SVG.xMark className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    /* 非編輯模式 */
                    <>
                      <button
                        onClick={() => toggleCollapse(category.id)}
                        className="flex items-center flex-grow text-left min-w-0"
                      >
                        <h3
                          className={`text-lg font-semibold flex items-center truncate ${theme.accentText}`}
                        >
                          {category.name} (
                          {category.items.filter((i) => i.isCompleted).length}/
                          {category.items.length})
                        </h3>
                      </button>
                      <div className="flex shrink-0 ml-2">
                        <button
                          onClick={() => {
                            setEditingCategoryId(category.id);
                            setTempEditText(category.name);
                          }}
                          className="p-1 text-gray-400"
                        >
                          <ICON_SVG.pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteCategoryClick(
                              category.id,
                              category.name
                            )
                          }
                          className="p-1 text-red-400 ml-1"
                        >
                          <ICON_SVG.trash className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {!isCollapsed && (
                  <ul className="divide-y divide-gray-200 bg-white">
                    {category.items.map((item) => {
                      const isEditingItem = editingItemId === item.id;
                      return (
                        <li
                          key={item.id}
                          className="p-3 flex justify-between items-center transition hover:bg-gray-50"
                        >
                          {isEditingItem ? (
                            /* === 項目編輯模式：強化按鈕視覺 === */
                            <div className="flex items-center w-full space-x-2">
                              <input
                                autoFocus
                                type="text"
                                value={tempEditText}
                                onChange={(e) =>
                                  setTempEditText(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    updateItemName(item.id, tempEditText);
                                    setEditingItemId(null);
                                  }
                                }}
                                className={`flex-grow min-w-0 px-2 py-2 border border-gray-300 rounded text-base ${theme.ringFocus} ${theme.borderFocus}`}
                              />
                              <button
                                onClick={() => {
                                  updateItemName(item.id, tempEditText);
                                  setEditingItemId(null);
                                }}
                                className="bg-green-500 text-white shrink-0 p-2 rounded-md shadow-sm active:scale-95"
                              >
                                <ICON_SVG.check className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => setEditingItemId(null)}
                                className="bg-gray-200 text-gray-600 shrink-0 p-2 rounded-md shadow-sm active:scale-95"
                              >
                                <ICON_SVG.xMark className="w-5 h-5" />
                              </button>
                            </div>
                          ) : (
                            /* 非編輯模式 */
                            <>
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
                                  className={`form-checkbox h-5 w-5 ${theme.accentText} rounded border-gray-300 focus:ring-0`}
                                />
                                <span
                                  className={`text-base truncate ${
                                    item.isCompleted
                                      ? "line-through text-gray-400"
                                      : theme.itemRowText
                                  }`}
                                >
                                  {item.name}
                                </span>
                              </label>
                              <div className="flex shrink-0 ml-2">
                                <button
                                  onClick={() => {
                                    setEditingItemId(item.id);
                                    setTempEditText(item.name);
                                  }}
                                  className="text-gray-400 p-1"
                                >
                                  <ICON_SVG.pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteItemClick(
                                      category.id,
                                      item.id,
                                      item.name
                                    )
                                  }
                                  className="text-red-300 p-1 ml-1"
                                >
                                  <ICON_SVG.trash className="w-4 h-4" />
                                </button>
                              </div>
                            </>
                          )}
                        </li>
                      );
                    })}
                    {/* 新增項目輸入框 */}
                    <li className={`p-3 ${theme.itemInputBg}`}>
                      <div className="flex space-x-2 items-center">
                        <input
                          type="text"
                          placeholder="新增項目"
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
                          className={`flex-grow min-w-0 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base ${theme.ringFocus} ${theme.borderFocus}`}
                        />
                        <button
                          onClick={() => handleAddItemPress(category.id)}
                          className={`shrink-0 p-2.5 rounded-md text-white shadow-sm ${theme.buttonPrimary}`}
                        >
                          <ICON_SVG.plusSmall className="w-6 h-6" />
                        </button>
                      </div>
                    </li>
                  </ul>
                )}
              </div>
            );
          })}
        </div>
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
