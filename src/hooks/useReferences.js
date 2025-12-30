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
  orderBy,
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
    // 改為依照 order 排序
    const q = query(refCol, orderBy("order", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
      // 計算新的 order (放在目前列表最後面)
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
      // 樂觀更新前端畫面
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