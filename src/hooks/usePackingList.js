import { useState, useEffect, useRef, useCallback } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db, appId } from "../config/firebase";

export const usePackingList = (userId, itineraryId) => {
  const [listCategories, setListCategories] = useState([]);
  const itemUnsubscribersRef = useRef([]);

  // 1. 監聽清單類別與項目 (最複雜的那段)
  useEffect(() => {
    if (!itineraryId || !userId || !db) {
      setListCategories([]);
      return;
    }

    const categoriesColRef = collection(
      db,
      `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/listCategories`
    );

    // 清除舊的監聽器
    itemUnsubscribersRef.current.forEach((unsub) => unsub());
    itemUnsubscribersRef.current = [];

    const unsubscribeCategories = onSnapshot(
      categoriesColRef,
      (categorySnapshot) => {
        const categoriesData = [];

        // 如果沒有類別，清空列表
        if (categorySnapshot.empty) {
          setListCategories([]);
        }

        categorySnapshot.docs.forEach((catDoc) => {
          const category = { id: catDoc.id, ...catDoc.data(), items: [] };
          categoriesData.push(category);

          // 針對每個類別，去監聽底下的 items
          const itemsColRef = collection(
            db,
            `${categoriesColRef.path}/${category.id}/items`
          );

          const unsubscribeItems = onSnapshot(itemsColRef, (itemSnapshot) => {
            const items = itemSnapshot.docs.map((itemDoc) => ({
              id: itemDoc.id,
              ...itemDoc.data(),
            }));

            // 更新狀態：找到對應的類別，把 items 放進去
            setListCategories((prev) => {
              const updated = prev.map((pCat) =>
                pCat.id === category.id
                  ? {
                      ...pCat,
                      items: items.sort(
                        (a, b) =>
                          (a.createdAt?.seconds || 0) -
                          (b.createdAt?.seconds || 0)
                      ),
                    }
                  : pCat
              );
              // 類別本身也要排序
              return updated.sort(
                (a, b) =>
                  (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
              );
            });
          });

          itemUnsubscribersRef.current.push(unsubscribeItems);
        });

        // 初始化類別列表 (尚未載入 Items 前先顯示類別)
        setListCategories((prev) => {
          // 簡單的比對，如果類別數量變了，或者 ID 變了，就更新
          // 這裡為了簡化，我們直接使用新的 categoriesData 結構，
          // 但保留舊的 items (如果有的話) 防止閃爍，
          // 不過因為上面的 items listener 會立刻觸發，這裡直接 set 也可以。
          // 為了確保順序：
          return categoriesData.sort(
            (a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
          );
        });
      }
    );

    return () => {
      unsubscribeCategories();
      itemUnsubscribersRef.current.forEach((unsub) => unsub());
    };
  }, [itineraryId, userId]);

  // 2. 新增類別
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
        throw error;
      }
    },
    [itineraryId, userId]
  );

  // 3. 刪除類別 (連同子項目)
  const deleteCategory = useCallback(
    async (categoryId) => {
      if (!itineraryId) return;
      try {
        const categoryDocPath = `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/listCategories/${categoryId}`;
        const itemsColRef = collection(db, `${categoryDocPath}/items`);
        const snapshot = await getDocs(itemsColRef);
        // 先刪除所有子項目
        await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
        // 再刪除類別本身
        await deleteDoc(doc(db, categoryDocPath));
      } catch (error) {
        console.error("刪除類別失敗", error);
      }
    },
    [itineraryId, userId]
  );

  // 4. 新增項目
  const addItemToList = useCallback(
    async (categoryId, itemName) => {
      if (!itineraryId || !itemName.trim()) return;
      try {
        await addDoc(
          collection(
            db,
            `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/listCategories/${categoryId}/items`
          ),
          {
            name: itemName.trim(),
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

  // 5. 切換完成狀態
  const toggleItemCompletion = useCallback(
    async (categoryId, itemId, isCompleted) => {
      if (!itineraryId) return;
      try {
        await updateDoc(
          doc(
            db,
            `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/listCategories/${categoryId}/items/${itemId}`
          ),
          { isCompleted: isCompleted, updatedAt: serverTimestamp() }
        );
      } catch (error) {
        console.error("更新狀態失敗", error);
      }
    },
    [itineraryId, userId]
  );

  // 6. 刪除項目
  const deleteItem = useCallback(
    async (categoryId, itemId) => {
      if (!itineraryId) return;
      try {
        await deleteDoc(
          doc(
            db,
            `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/listCategories/${categoryId}/items/${itemId}`
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
