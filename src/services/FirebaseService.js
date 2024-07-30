import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';
import firebaseConfig from '../config';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const addTransaction = async (transaction) => {
  try {
    const docRef = await addDoc(collection(db, 'transactions'), transaction);
    console.log('Document written with ID: ', docRef.id);
    return docRef.id;
  } catch (e) {
    console.error('Error adding document: ', e);
    throw e;
  }
};

export const getTransactions = async () => {
  const transactions = [];
  const querySnapshot = await getDocs(collection(db, 'transactions'));
  querySnapshot.forEach((doc) => {
    transactions.push({ id: doc.id, ...doc.data() });
  });
  return transactions;
};