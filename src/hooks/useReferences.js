// src/hooks/useReferences.js (完整替換)
import { useState, useEffect, useCallback } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc, // 新增
  doc,
  serverTimestamp,
  query,
} from "firebase/firestore";
import { db, appId } from "../config/firebase";

export const useReferences = (userId, itineraryId, isEnabled) => {
  const [references, setReferences] = useState([]);

  useEffect(() => {
    if (!isEnabled || !itineraryId || !userId || !db) return;
    const refCol = collection(
      db,
      `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/references`
    );
    const q = query(refCol);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      // 依建立時間排序
      data.sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      );
      setReferences(data);
    });
    return () => unsubscribe();
  }, [itineraryId, userId, isEnabled]);

  const addReference = useCallback(
    async (data) => {
      const refCol = collection(
        db,
        `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/references`
      );
      await addDoc(refCol, { ...data, createdAt: serverTimestamp() });
    },
    [itineraryId, userId]
  );

  // 新增：更新功能
  const updateReference = useCallback(
    async (id, data) => {
      const refRef = doc(
        db,
        `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/references/${id}`
      );
      await updateDoc(refRef, { ...data, updatedAt: serverTimestamp() });
    },
    [itineraryId, userId]
  );

  const deleteReference = useCallback(
    async (id) => {
      await deleteDoc(
        doc(
          db,
          `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/references/${id}`
        )
      );
    },
    [itineraryId, userId]
  );

  return { references, addReference, updateReference, deleteReference };
};
