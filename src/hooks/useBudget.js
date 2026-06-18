// src/hooks/useBudget.js
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db, appId } from "../config/firebase";

export const useBudget = (userId, itineraryId, travelerCount) => {
  const [expenses, setExpenses] = useState([]);
  const count = travelerCount || 1;

  useEffect(() => {
    if (!itineraryId || !userId || !db) {
      setExpenses([]);
      return;
    }
    const unsubscribe = onSnapshot(
      collection(
        db,
        `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/expenses`
      ),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        data.sort((a, b) =>
          a.day !== b.day
            ? a.day - b.day
            : (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
        );
        setExpenses(data);
      }
    );
    return () => unsubscribe();
  }, [itineraryId, userId]);

  const totals = useMemo(() => {
    return expenses.reduce((acc, item) => {
      const curr = item.currency || "TWD";
      const amount = parseFloat(item.amount) || 0;
      const finalAmount = item.isPerPerson ? amount * count : amount;
      acc[curr] = (acc[curr] || 0) + finalAmount;
      return acc;
    }, {});
  }, [expenses, count]);

  const { groupedExpenses, sortedDays } = useMemo(() => {
    const grouped = expenses.reduce((acc, item) => {
      const dayKey = item.day || 1;
      if (!acc[dayKey]) acc[dayKey] = [];
      acc[dayKey].push(item);
      return acc;
    }, {});
    return {
      groupedExpenses: grouped,
      sortedDays: Object.keys(grouped).sort((a, b) => Number(a) - Number(b)),
    };
  }, [expenses]);

  const addExpense = useCallback(
    async (newItem) => {
      if (!itineraryId || !newItem.title.trim() || newItem.amount === "")
        return;
      await addDoc(
        collection(
          db,
          `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/expenses`
        ),
        {
          ...newItem,
          title: newItem.title.trim(),
          description: (newItem.description || "").trim(),
          amount: parseFloat(newItem.amount),
          day: Number(newItem.day),
          createdAt: serverTimestamp(),
        }
      );
    },
    [itineraryId, userId]
  );

  const updateExpense = useCallback(
    async (id, editData) => {
      if (!itineraryId || !editData.title.trim() || editData.amount === "")
        return;
      await updateDoc(
        doc(
          db,
          `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/expenses/${id}`
        ),
        {
          ...editData,
          title: editData.title.trim(),
          description: (editData.description || "").trim(),
          amount: parseFloat(editData.amount),
          day: Number(editData.day),
          updatedAt: serverTimestamp(),
        }
      );
    },
    [itineraryId, userId]
  );

  const deleteExpense = useCallback(
    async (id) => {
      if (!itineraryId || !id) return;
      await deleteDoc(
        doc(
          db,
          `artifacts/${appId}/users/${userId}/itineraries/${itineraryId}/expenses/${id}`
        )
      );
    },
    [itineraryId, userId]
  );

  return {
    expenses,
    totals,
    groupedExpenses,
    sortedDays,
    addExpense,
    updateExpense,
    deleteExpense,
  };
};