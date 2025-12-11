import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
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

  // 1. 讀取活動列表 (監聽資料庫)
  useEffect(() => {
    // 如果資料不齊全，就不動作
    if (!itineraryId || !db) return;
    const activitiesColRef = collection(
      db,
      `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/activities`
    );

    // 只抓取「目前這一天」的活動
    const q = query(activitiesColRef, where("day", "==", activeDay));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        // 依照 order 排序
        data.sort(
          (a, b) =>
            (a.order !== undefined ? a.order : 9999) -
            (b.order !== undefined ? b.order : 9999)
        );
        setActivities(data);
      },
      (err) => {
        console.error("讀取活動失敗", err);
        setError(err.message);
      }
    );
    return () => unsubscribe();
  }, [itineraryId, activeDay, userId]);

  // 2. 新增活動
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
      try {
        await deleteDoc(
          doc(
            db,
            `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/activities/${activityId}`
          )
        );
      } catch (err) {
        console.error("刪除失敗", err);
      }
    },
    [itineraryId, userId]
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
