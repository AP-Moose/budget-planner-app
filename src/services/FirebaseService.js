import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { firebaseConfig } from '../config';
import { getCategoryType } from '../utils/categories';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function addTransaction(transaction) {
  try {
    const transactionToSave = {
      ...transaction,
      amount: Number(transaction.amount),
      type: getCategoryType(transaction.category),
      date: new Date(transaction.date) // Convert to Date object if it's a string
    };
    const docRef = await addDoc(collection(db, 'transactions'), transactionToSave);
    return docRef.id;
  } catch (error) {
    console.error('Error adding transaction: ', error);
    throw error;
  }
}

export async function getTransactions() {
  try {
    const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      amount: Number(doc.data().amount),
      date: doc.data().date.toDate() // Convert Firestore Timestamp to JavaScript Date
    }));
  } catch (error) {
    console.error('Error getting transactions: ', error);
    throw error;
  }
}

export async function updateTransaction(id, updatedData) {
  try {
    const transactionRef = doc(db, 'transactions', id);
    if (updatedData.category) {
      updatedData.type = getCategoryType(updatedData.category);
    }
    await updateDoc(transactionRef, updatedData);
  } catch (error) {
    console.error('Error updating transaction: ', error);
    throw error;
  }
}

export async function deleteTransaction(id) {
  try {
    const transactionRef = doc(db, 'transactions', id);
    await deleteDoc(transactionRef);
  } catch (error) {
    console.error('Error deleting transaction: ', error);
    throw error;
  }
}