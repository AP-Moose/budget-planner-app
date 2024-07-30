import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';
import firebaseConfig from '../config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export const addTransaction = async (transaction) => {
  try {
    const docRef = await addDoc(collection(db, 'transactions'), transaction);
    console.log('Transaction added with ID: ', docRef.id);
    return docRef.id;
  } catch (e) {
    console.error('Error adding transaction: ', e);
    throw e;
  }
};

export const getTransactions = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'transactions'));
    const transactions = [];
    querySnapshot.forEach((doc) => {
      transactions.push({ id: doc.id, ...doc.data() });
    });
    return transactions;
  } catch (e) {
    console.error('Error getting transactions: ', e);
    throw e;
  }
};