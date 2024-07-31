import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { firebaseConfig } from '../config';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function addTransaction(transaction) {
  try {
    const docRef = await addDoc(collection(db, 'transactions'), transaction);
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
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting transactions: ', error);
    throw error;
  }
}