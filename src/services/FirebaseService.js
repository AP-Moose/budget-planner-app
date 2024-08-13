import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, updateDoc, deleteDoc, doc, where, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { firebaseConfig } from '../config';
import { getCategoryType } from '../utils/categories';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('User signed up successfully:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing up:', error.code, error.message);
    throw error;
  }
};

export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User signed in successfully:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
    console.log('User signed out successfully');
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('Password reset email sent successfully');
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

export const getCurrentUser = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    console.log('Auth state changed:', user ? user.uid : 'No user');
    callback(user);
  });
};

export const addTransaction = async (transaction) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('No user logged in');
      throw new Error('No user logged in');
    }

    const transactionToSave = {
      ...transaction,
      amount: Number(transaction.amount),
      type: getCategoryType(transaction.category),
      date: transaction.date instanceof Date ? transaction.date : new Date(transaction.date),
      userId: user.uid
    };

    console.log('Attempting to save transaction:', transactionToSave);
    const docRef = await addDoc(collection(db, 'transactions'), transactionToSave);
    console.log('Transaction saved successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

export const addMultipleTransactions = async (transactions) => {
  const results = [];
  for (const transaction of transactions) {
    try {
      const id = await addTransaction(transaction);
      results.push({ success: true, id });
    } catch (error) {
      console.error('Error adding transaction in batch:', error);
      results.push({ success: false, error: error.message });
    }
  }
  return results;
};

export const getTransactions = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('No user logged in');
      throw new Error('No user logged in');
    }

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      amount: Number(doc.data().amount),
      date: doc.data().date.toDate()
    }));
    console.log(`Retrieved ${transactions.length} transactions for user:`, user.uid);
    return transactions;
  } catch (error) {
    console.error('Error getting transactions:', error);
    throw new Error('Failed to fetch transactions. Please try again later.');
  }
};

export const updateTransaction = async (id, updatedData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('No user logged in');
      throw new Error('No user logged in');
    }

    const transactionRef = doc(db, 'transactions', id);
    if (updatedData.category) {
      updatedData.type = getCategoryType(updatedData.category);
    }
    await updateDoc(transactionRef, updatedData);
    console.log('Transaction updated successfully:', id);
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

export const deleteTransaction = async (id) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('No user logged in');
      throw new Error('No user logged in');
    }

    const transactionRef = doc(db, 'transactions', id);
    await deleteDoc(transactionRef);
    console.log('Transaction deleted successfully:', id);
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

export const updateBudgetGoal = async (category, updatedData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('No user logged in');
      throw new Error('No user logged in');
    }

    const goalRef = doc(db, 'budgetGoals', `${user.uid}_${category}`);
    await setDoc(goalRef, {
      ...updatedData,
      userId: user.uid,
      category: category,
      amount: Number(updatedData.amount)
    }, { merge: true });
    console.log('Budget goal updated successfully for category:', category);
  } catch (error) {
    console.error('Error updating budget goal:', error);
    throw error;
  }
};

export const getBudgetGoals = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('No user logged in');
      throw new Error('No user logged in');
    }

    const q = query(
      collection(db, 'budgetGoals'),
      where('userId', '==', user.uid)
    );
    
    const snapshot = await getDocs(q);
    const budgetGoals = snapshot.docs.map(doc => ({
      id: doc.id.split('_')[1], // Extract the category from the document ID
      ...doc.data(),
      amount: Number(doc.data().amount)
    }));
    console.log(`Retrieved ${budgetGoals.length} budget goals for user:`, user.uid);
    return budgetGoals;
  } catch (error) {
    console.error('Error getting budget goals:', error);
    throw error;
  }
};

export default {
  signUp,
  signIn,
  logOut,
  resetPassword,
  getCurrentUser,
  addTransaction,
  addMultipleTransactions,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  updateBudgetGoal,
  getBudgetGoals,
};