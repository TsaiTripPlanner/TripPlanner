import { useState, useEffect, useCallback, useMemo } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs, // 用於匯入功能：讀取舊資料
  writeBatch, // 用於匯入功能：批次寫入
} from "firebase/firestore";
import { db, appId } from "../config/firebase";

export const usePackingList = (userId, itineraryId, isEnabled) => {
  const [categories, setCategories] = useState([]);
  const [allItems, setAllItems] = useState([]);

  // 1. 監聽資料 (維持原本優化後的寫法)
  useEffect(() => {
    if (!isEnabled || !itineraryId || !userId || !db) {
      setCategories([]);
      setAllItems([]);
      return;
    }

    const categoriesColRef = collection(
      db,
      `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/listCategories`
    );
    const unsubCategories = onSnapshot(categoriesColRef, (snapshot) => {
      const cats = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      cats.sort(
        (a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
      );
      setCategories(cats);
    });

    const itemsColRef = collection(
      db,
      `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/packingItems`
    );
    const unsubItems = onSnapshot(itemsColRef, (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAllItems(items);
    });

    return () => {
      unsubCategories();
      unsubItems();
    };
  }, [itineraryId, userId, isEnabled]);

  // 修改後的組裝邏輯
  const listCategories = useMemo(() => {
    // 先建立一個物件來存放「分類後的物品」
    const itemsGroupedByCat = {};
    
    // 只跑一次迴圈，將所有物品按 categoryId 歸類
    allItems.forEach(item => {
      if (!itemsGroupedByCat[item.categoryId]) {
        itemsGroupedByCat[item.categoryId] = [];
      }
      itemsGroupedByCat[item.categoryId].push(item);
    });

    // 根據類別清單來組裝
    return categories.map((cat) => {
      // 直接從物件拿，速度極快
      const myItems = itemsGroupedByCat[cat.id] || [];
      // 依時間排序
      myItems.sort(
        (a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
      );
      return { ...cat, items: myItems };
    });
  }, [categories, allItems]);

  // --- 基本 CRUD 功能 ---

  const addCategory = useCallback(
    async (name) => {
      if (!itineraryId || !name.trim()) return;
      try {
        await addDoc(
          collection(
            db,
            `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/listCategories`
          ),
          { name: name.trim(), createdAt: serverTimestamp() }
        );
      } catch (error) {
        console.error("新增類別失敗", error);
      }
    },
    [itineraryId, userId]
  );

  // ★★★ 新增功能：更新類別名稱
  const updateCategoryName = useCallback(
    async (categoryId, newName) => {
      if (!itineraryId || !newName.trim()) return;
      try {
        await updateDoc(
          doc(
            db,
            `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/listCategories/${categoryId}`
          ),
          { name: newName.trim(), updatedAt: serverTimestamp() }
        );
      } catch (error) {
        console.error("更新類別失敗", error);
      }
    },
    [itineraryId, userId]
  );

  const deleteCategory = useCallback(
    async (categoryId) => {
      if (!itineraryId) return;
      try {
        const batch = writeBatch(db);
        const itemsToDelete = allItems.filter(
          (item) => item.categoryId === categoryId
        );
        itemsToDelete.forEach((item) => {
          const itemRef = doc(
            db,
            `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/packingItems/${item.id}`
          );
          batch.delete(itemRef);
        });
        const categoryRef = doc(
          db,
          `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/listCategories/${categoryId}`
        );
        batch.delete(categoryRef);
        await batch.commit();
      } catch (error) {
        console.error("刪除類別失敗", error);
      }
    },
    [itineraryId, userId, allItems]
  );

  const addItemToList = useCallback(
    async (categoryId, itemName) => {
      if (!itineraryId || !itemName.trim()) return;
      try {
        await addDoc(
          collection(
            db,
            `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/packingItems`
          ),
          {
            name: itemName.trim(),
            categoryId: categoryId,
            isCompleted: false,
            createdAt: serverTimestamp(),
          }
        );
      } catch (error) {
        console.error("新增項目失敗", error);
      }
    },
    [itineraryId, userId]
  );

  // ★★★ 新增功能：更新項目名稱
  const updateItemName = useCallback(
    async (itemId, newName) => {
      if (!itineraryId || !newName.trim()) return;
      try {
        await updateDoc(
          doc(
            db,
            `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/packingItems/${itemId}`
          ),
          { name: newName.trim(), updatedAt: serverTimestamp() }
        );
      } catch (error) {
        console.error("更新項目失敗", error);
      }
    },
    [itineraryId, userId]
  );

  const toggleItemCompletion = useCallback(
    async (itemId, isCompleted) => {
      if (!itineraryId) return;
      // --- 樂觀更新開始 ---
      // 先記錄舊的資料，以防萬一要回滾
      const previousItems = [...allItems];

      // 立即更新本地狀態（使用者會看到立刻打勾/取消）
      setAllItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, isCompleted } : item
        )
      );
      // --- 樂觀更新結束 ---
      try {
        await updateDoc(
          doc(
            db,
            `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/packingItems/${itemId}`
          ),
          { isCompleted: isCompleted, updatedAt: serverTimestamp() }
        );
      } catch (error) {
        console.error("更新狀態失敗", error);
        // 如果失敗，把資料換回原本的樣子
        setAllItems(previousItems);
        alert("網路連線不穩定，請重試");
      }
    },
    [itineraryId, userId, allItems]
  );

  const deleteItem = useCallback(
    async (itemId) => {
      if (!itineraryId || !itemId) return;
      // --- 樂觀更新開始 ---
      const previousItems = [...allItems];
      setAllItems((prevItems) =>
        prevItems.filter((item) => item.id !== itemId)
      );
      // --- 樂觀更新結束 ---
      try {
        await deleteDoc(
          doc(
            db,
            `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/packingItems/${itemId}`
          )
        );
      } catch (error) {
        console.error("刪除項目失敗", error);
        setAllItems(previousItems); // 失敗則回滾
      }
    },
    [itineraryId, userId, allItems]
  );

  // ★★★ 修改後的：從其他行程匯入清單 (保證順序版)
  const importFromItinerary = useCallback(
    async (sourceItineraryId) => {
      if (
        !itineraryId ||
        !sourceItineraryId ||
        itineraryId === sourceItineraryId
      )
        return;

      try {
        const batch = writeBatch(db);

        // 1. 讀取「來源行程」的類別
        const sourceCatsRef = collection(
          db,
          `artifacts/${appId}/users/${userId}/itineraries/${sourceItineraryId}/listCategories`
        );
        const sourceCatsSnapshot = await getDocs(sourceCatsRef);

        // 2. 讀取「來源行程」的物品
        const sourceItemsRef = collection(
          db,
          `artifacts/${appId}/users/${userId}/itineraries/${sourceItineraryId}/packingItems`
        );
        const sourceItemsSnapshot = await getDocs(sourceItemsRef);

        if (sourceCatsSnapshot.empty) {
          alert("來源行程沒有清單資料可以匯入");
          return;
        }

        // ★ 步驟 A：先整理並「排序」來源資料 (這一步最關鍵)
        const sourceCats = sourceCatsSnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        // 依照舊的建立時間排序
        sourceCats.sort(
          (a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
        );

        const sourceItems = sourceItemsSnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        // 物品也排序
        sourceItems.sort(
          (a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
        );

        // 用來對照舊 ID -> 新 ID 的對應表
        const catIdMap = {};

        // 設定一個基準時間 (現在)
        const baseTime = Date.now();

        // 3. 準備寫入新的類別
        const targetCatsRef = collection(
          db,
          `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/listCategories`
        );

        sourceCats.forEach((sourceData, index) => {
          const newDocRef = doc(targetCatsRef);
          // ★ 關鍵：手動設定時間，每一個類別間隔 1 秒，確保順序不亂
          const newCreatedAt = new Date(baseTime + index * 1000);

          batch.set(newDocRef, {
            name: sourceData.name,
            createdAt: newCreatedAt,
          });
          catIdMap[sourceData.id] = newDocRef.id;
        });

        // 4. 準備寫入新的物品
        const targetItemsRef = collection(
          db,
          `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/packingItems`
        );

        // 為了避免物品的時間跟類別重疊，我們把物品的時間往後推一點 (例如從 1000 秒後開始算)
        const itemsBaseTime = baseTime + 1000000;

        sourceItems.forEach((sourceData, index) => {
          // 如果這個物品所屬的類別有被我們複製到，才複製物品
          if (catIdMap[sourceData.categoryId]) {
            const newDocRef = doc(targetItemsRef);
            // ★ 關鍵：物品也依序給予時間差
            const newCreatedAt = new Date(itemsBaseTime + index * 1000);

            batch.set(newDocRef, {
              name: sourceData.name,
              categoryId: catIdMap[sourceData.categoryId],
              isCompleted: false, // 匯入的預設為未完成
              createdAt: newCreatedAt,
            });
          }
        });

        // 5. 執行寫入
        await batch.commit();
        alert("匯入成功！");
      } catch (error) {
        console.error("匯入失敗", error);
        alert("匯入發生錯誤");
      }
    },
    [itineraryId, userId]
  );

  return {
    listCategories,
    addCategory,
    updateCategoryName, // 新增
    deleteCategory,
    addItemToList,
    updateItemName, // 新增
    toggleItemCompletion,
    deleteItem,
    importFromItinerary, // 新增
  };
};
