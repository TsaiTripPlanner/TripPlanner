// src/hooks/useReferences.js
import { useState, useEffect, useCallback } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  writeBatch
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
    
    // 重要：不要在 query 裡寫 orderBy，否則沒 order 欄位的舊資料會消失
    const q = query(refCol);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      
      // 在前端進行排序：有 order 的排前面，沒 order 的依建立時間排
      data.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        // 如果沒有 order 欄位，就用建立時間排序
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      });
      
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
      // 計算新的 order
      const newOrder = references.length;
        
      await addDoc(refCol, { 
        ...data, 
        order: newOrder,
        createdAt: serverTimestamp() 
      });
    },
    [itineraryId, userId, references]
  );

  const updateReference = useCallback(
    async (id, data) => {
      const refRef = doc(db, `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/references/${id}`);
      await updateDoc(refRef, { ...data, updatedAt: serverTimestamp() });
    },
    [itineraryId, userId]
  );

  const deleteReference = useCallback(
    async (id) => {
      await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/references/${id}`));
    },
    [itineraryId, userId]
  );

  const reorderReferences = useCallback(
    async (newList) => {
      setReferences(newList);
      const batch = writeBatch(db);
      newList.forEach((item, index) => {
        const ref = doc(db, `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/references/${item.id}`);
        batch.update(ref, { order: index });
      });
      await batch.commit();
    },
    [itineraryId, userId]
  );

  return { references, addReference, updateReference, deleteReference, reorderReferences };
};