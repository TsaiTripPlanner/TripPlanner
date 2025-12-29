import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db, appId } from "../config/firebase";

// 這個 Hook 接收三個參數：使用者ID、行程ID、目前是第幾天
export const useActivities = (userId, itineraryId, activeDay) => {
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState(null);

  // 讀取活動列表 (監聽資料庫)
  useEffect(() => {
    // 如果資料不齊全，就不動作
    if (!itineraryId || !db) return;
    const activitiesColRef = collection(
      db,
      `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/activities`
    );

    // 修改查詢：加入排序條件
    // 我們希望先按「開始時間」排，時間一樣時再按「手動順序」排
    const q = query(
      activitiesColRef,
      where("day", "==", activeDay),
      orderBy("startTime", "asc"), 
      orderBy("order", "asc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // 這裡變得很乾淨，因為 Firebase 回傳時就排好序了
        let data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setActivities(data);
      },
      (err) => {
        console.error("讀取活動失敗", err);
        setError(err.message);

        // 重要提示：如果你在控制台看到一個連結，請點擊它來建立「索引」
        if (err.message.includes("index")) {
          console.warn("請點擊上方的連結以建立 Firestore 複合索引，否則排序功能無法運作。");
        }
      }
    );
    return () => unsubscribe();
  }, [itineraryId, activeDay, userId]);

  // 新增活動
  const addActivity = useCallback(
    async (newActivityData) => {
      if (!itineraryId) return;
      try {
        const activitiesColPath = `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/activities`;
        const newOrder = activities.length; // 排在最後面
        await addDoc(collection(db, activitiesColPath), {
          ...newActivityData,
          day: activeDay,
          order: newOrder,
          isCompleted: false,
          createdAt: serverTimestamp(),
        });
        return true; // 回傳成功
      } catch (err) {
        console.error("新增失敗", err);
        throw err; // 把錯誤丟出去給 App.js 處理
      }
    },
    [itineraryId, userId, activeDay, activities.length]
  );

  // 3. 刪除活動
  const deleteActivity = useCallback(
    async (activityId) => {
      if (!itineraryId) return;
      // --- 樂觀更新開始 ---
      const previousActivities = [...activities];
      // 立即在畫面上移除該活動
      setActivities((prev) => prev.filter((act) => act.id !== activityId));
      // --- 樂觀更新結束 ---
      try {
        await deleteDoc(
          doc(
            db,
            `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/activities/${activityId}`
          )
        );
      } catch (err) {
        console.error("刪除失敗，恢復列表", err);
        setActivities(previousActivities); // 失敗則恢復
        alert("刪除失敗，請檢查網路連線");
      }
    },
    [itineraryId, userId, activities]
  );

  // 4. 更新活動內容
  const updateActivity = useCallback(
    async (activityId, updateData) => {
      if (!itineraryId) return;
      try {
        await updateDoc(
          doc(
            db,
            `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/activities/${activityId}`
          ),
          {
            ...updateData,
            updatedAt: serverTimestamp(),
          }
        );
      } catch (err) {
        console.error("更新失敗", err);
      }
    },
    [itineraryId, userId]
  );

  // 5. 更新活動排序 (給拖曳功能用)
  const reorderActivities = useCallback(
    async (newActivitiesList) => {
      // 先在前端更新畫面 (讓使用者覺得很快)
      setActivities(newActivitiesList);

      if (!itineraryId) return;
      try {
        const batch = writeBatch(db);
        newActivitiesList.forEach((act, index) => {
          // 只有順序真的變了才寫入資料庫，節省流量
          if (act.order !== index) {
            const ref = doc(
              db,
              `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/activities/${act.id}`
            );
            batch.update(ref, { order: index });
          }
        });
        await batch.commit();
      } catch (err) {
        console.error("排序更新失敗", err);
        alert("排序更新失敗，請檢查網路連線");
      }
    },
    [itineraryId, userId]
  );

  // 把所有功能打包回傳
  return {
    activities,
    addActivity,
    deleteActivity,
    updateActivity,
    reorderActivities,
  };
};
