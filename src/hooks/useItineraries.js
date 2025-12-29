import { useState, useEffect, useCallback } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  getDocs,
  writeBatch,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, appId } from "../config/firebase";

export const useItineraries = (userId) => {
  const [allItineraries, setAllItineraries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. 讀取行程列表 (監聽)
  useEffect(() => {
    if (!userId || !db) return;

    const itinerariesColRef = collection(
      db,
      `artifacts/${appId}/users/${userId}/itineraries`
    );
    // 修改查詢：排序並限制只顯示最近的 20 個行程
    const q = query(
      itinerariesColRef,
      orderBy("startDate", "desc"), 
      limit(20)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const trips = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // 因為 Firebase 已經幫我們排好序了，這裡不需要再寫 .sort()
        setAllItineraries(trips);
        setIsLoading(false);
      },
      (err) => {
        console.error("讀取行程列表失敗", err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // 2. 建立行程
  const createItinerary = useCallback(
    async (data) => {
      // data 包含 { title, days, startDate }
      const itinerariesColRef = collection(
        db,
        `artifacts/${appId}/users/${userId}/itineraries`
      );
      await addDoc(itinerariesColRef, {
        title: data.title.trim(),
        durationDays: Number(data.days),
        startDate: data.startDate,
        createdAt: serverTimestamp(),
      });
    },
    [userId]
  );

  // 3. 更新行程 (包含更新標題、天數、日期)
  const updateItinerary = useCallback(
    async (itineraryId, data) => {
      // data 包含要更新的欄位，例如 { title: "新標題" }
      const itineraryRef = doc(
        db,
        `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}`
      );
      await updateDoc(itineraryRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    },
    [userId]
  );

  // 4. 刪除行程 (包含刪除子集合)
  const deleteItinerary = useCallback(
    async (itineraryId) => {
      try {
        const activitiesRef = collection(
          db,
          `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/activities`
        );
        const actSnap = await getDocs(activitiesRef);

        const batch = writeBatch(db);
        actSnap.docs.forEach((doc) => batch.delete(doc.ref));

        const catsRef = collection(
          db,
          `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/listCategories`
        );
        const catSnap = await getDocs(catsRef);
        catSnap.docs.forEach((doc) => batch.delete(doc.ref));

        batch.delete(
          doc(db, `artifacts/${appId}/users/${userId}/itineraries`, itineraryId)
        );
        await batch.commit();
      } catch (e) {
        console.error("刪除行程失敗", e);
        throw e;
      }
    },
    [userId]
  );

  return {
    allItineraries,
    isLoading,
    error,
    createItinerary,
    updateItinerary,
    deleteItinerary,
  };
};
