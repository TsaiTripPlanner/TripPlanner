import { useState, useEffect, useCallback, useMemo } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db, appId } from "../config/firebase";

export const usePackingList = (userId, itineraryId) => {
  // 1. 改用兩個獨立的 State 來儲存原始資料
  const [categories, setCategories] = useState([]);
  const [allItems, setAllItems] = useState([]);

  // 2. 監聽資料 (優化版：只用兩個監聽器)
  useEffect(() => {
    if (!itineraryId || !userId || !db) {
      setCategories([]);
      setAllItems([]);
      return;
    }

    // --- 監聽器 A：分類 ---
    const categoriesColRef = collection(
      db,
      `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/listCategories`
    );
    const unsubCategories = onSnapshot(categoriesColRef, (snapshot) => {
      const cats = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      // 排序分類
      cats.sort(
        (a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
      );
      setCategories(cats);
    });

    // --- 監聽器 B：所有物品 (新路徑：packingItems) ---
    // 我們將物品移到 itinerary 的直接子集合，而不是放在 category 裡面
    const itemsColRef = collection(
      db,
      `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/packingItems`
    );
    const unsubItems = onSnapshot(itemsColRef, (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      // 這裡先不用排，等分配到分類時再排
      setAllItems(items);
    });

    return () => {
      unsubCategories();
      unsubItems();
    };
  }, [itineraryId, userId]);

  // 3. 組裝資料 (Data Transformation)
  // 將平行的 categories 和 allItems 結合成 UI 需要的巢狀結構
  const listCategories = useMemo(() => {
    return categories.map((cat) => {
      // 篩選出屬於這個分類的物品 (看標籤 categoryId)
      const myItems = allItems.filter((item) => item.categoryId === cat.id);

      // 排序物品
      myItems.sort(
        (a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
      );

      return {
        ...cat,
        items: myItems, // 把物品塞進去
      };
    });
  }, [categories, allItems]);

  // 4. 新增類別 (沒變，跟原本一樣)
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

  // 5. 刪除類別 (邏輯改變：要刪除標籤符合的物品)
  const deleteCategory = useCallback(
    async (categoryId) => {
      if (!itineraryId) return;
      try {
        const batch = writeBatch(db);

        // 步驟 A: 刪除該分類下的所有物品
        // 這裡我們要在前端的 allItems 裡面找，比較快，不用再去後端 query 一次
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

        // 步驟 B: 刪除分類本身
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
    [itineraryId, userId, allItems] // 多了 allItems 依賴
  );

  // 6. 新增項目 (邏輯改變：路徑變了，且必須加上 categoryId 標籤)
  const addItemToList = useCallback(
    async (categoryId, itemName) => {
      if (!itineraryId || !itemName.trim()) return;
      try {
        // 寫入到 packingItems，並加上 categoryId 欄位
        await addDoc(
          collection(
            db,
            `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/packingItems`
          ),
          {
            name: itemName.trim(),
            categoryId: categoryId, // <--- 關鍵：貼標籤
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

  // 7. 切換完成狀態 (邏輯改變：路徑變了)
  const toggleItemCompletion = useCallback(
    async (categoryId, itemId, isCompleted) => {
      if (!itineraryId) return;
      try {
        // 注意路徑：現在不需要 categoryId 也可以找到 doc，因為 items 是平行的
        // 但為了參數一致性，原本的介面有傳 categoryId，我們這裡沒用到也沒關係
        await updateDoc(
          doc(
            db,
            `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/packingItems/${itemId}`
          ),
          { isCompleted: isCompleted, updatedAt: serverTimestamp() }
        );
      } catch (error) {
        console.error("更新狀態失敗", error);
      }
    },
    [itineraryId, userId]
  );

  // 8. 刪除項目 (邏輯改變：路徑變了)
  const deleteItem = useCallback(
    async (categoryId, itemId) => {
      if (!itineraryId) return;
      try {
        await deleteDoc(
          doc(
            db,
            `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/packingItems/${itemId}`
          )
        );
      } catch (error) {
        console.error("刪除項目失敗", error);
      }
    },
    [itineraryId, userId]
  );

  return {
    listCategories,
    addCategory,
    deleteCategory,
    addItemToList,
    toggleItemCompletion,
    deleteItem,
  };
};
