import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, updateDoc, deleteDoc, doc, where, setDoc, getDoc, onSnapshot, Timestamp } from 'firebase/firestore';
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
      throw new Error('No user logged in');
    }

    const transactionToSave = {
      ...transaction,
      amount: Number(transaction.amount),
      type: getCategoryType(transaction.category),
      date: transaction.date instanceof Date ? transaction.date : new Date(transaction.date),
      userId: user.uid,
      creditCard: Boolean(transaction.creditCard),
      creditCardId: transaction.creditCardId || null,
      isCardPayment: Boolean(transaction.isCardPayment)
    };

    console.log('Attempting to save transaction:', transactionToSave);
    const docRef = await addDoc(collection(db, 'transactions'), transactionToSave);
    console.log('Transaction saved successfully with ID:', docRef.id);

    if (transactionToSave.creditCard && transactionToSave.creditCardId) {
      await updateCreditCardBalance(transactionToSave.creditCardId, transactionToSave.amount, transactionToSave.type, transactionToSave.isCardPayment);
    }

    return docRef.id;
  } catch (error) {
    console.error('Error adding transaction:', error);
    if (error.code === 'permission-denied') {
      console.error('Permission denied. Current user:', auth.currentUser?.uid);
      console.error('Transaction data:', transaction);
      console.error('Firestore rules:', 'Please check your Firestore rules');
    }
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
      date: doc.data().date.toDate(),
      creditCard: Boolean(doc.data().creditCard),
      isCardPayment: Boolean(doc.data().isCardPayment)
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
    if (updatedData.creditCard !== undefined) {
      updatedData.creditCard = Boolean(updatedData.creditCard);
    }
    if (updatedData.isCardPayment !== undefined) {
      updatedData.isCardPayment = Boolean(updatedData.isCardPayment);
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

    // Encode the category name to make it safe for use in document ID
    const encodedCategory = encodeURIComponent(category.replace(/\s+/g, '_'));
    const goalId = `${user.uid}_${encodedCategory}`;
    const goalRef = doc(db, 'budgetGoals', goalId);
    
    // Check if the document exists
    const docSnap = await getDoc(goalRef);
    
    const goalData = {
      ...updatedData,
      userId: user.uid,
      category: category,
      amount: Number(updatedData.amount)
    };

    if (docSnap.exists()) {
      // Update existing document
      await updateDoc(goalRef, goalData);
    } else {
      // Create new document
      await setDoc(goalRef, goalData);
    }
    
    console.log('Budget goal updated successfully for category:', category);
  } catch (error) {
    console.error('Error updating budget goal:', error);
    if (error.code === 'permission-denied') {
      console.error('Permission denied. Current user:', auth.currentUser?.uid);
      console.error('Category:', category);
      console.error('Updated data:', updatedData);
    }
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
    const budgetGoals = snapshot.docs.map(doc => {
      const data = doc.data();
      let category = data.category;
      
      // If category is not in the data, try to extract it from the document ID
      if (!category) {
        const parts = doc.id.split('_');
        if (parts.length > 1) {
          category = decodeURIComponent(parts.slice(1).join('_').replace(/_/g, ' '));
        } else {
          // Fallback if we can't extract a category
          category = 'Unknown Category';
        }
      }

      return {
        id: doc.id,
        ...data,
        category: category,
        amount: Number(data.amount)
      };
    });
    console.log(`Retrieved ${budgetGoals.length} budget goals for user:`, user.uid);
    return budgetGoals;
  } catch (error) {
    console.error('Error getting budget goals:', error);
    throw error;
  }
};

export const addCreditCard = async (cardData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    const cardToSave = {
      ...cardData,
      userId: user.uid,
      balance: Number(cardData.startingBalance) || 0,
      limit: Number(cardData.limit) || 0,
      startingBalance: Number(cardData.startingBalance) || 0,
      startDate: Timestamp.fromDate(cardData.startDate || new Date()),
      lastUpdated: Timestamp.fromDate(new Date())
    };

    const docRef = await addDoc(collection(db, 'creditCards'), cardToSave);
    console.log('Credit card added successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding credit card:', error);
    throw error;
  }
};

export const getCreditCards = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    const q = query(
      collection(db, 'creditCards'),
      where('userId', '==', user.uid)
    );
    
    const snapshot = await getDocs(q);
    const creditCards = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        balance: Number(data.balance) || 0,
        limit: Number(data.limit) || 0,
        startingBalance: Number(data.startingBalance) || 0,
        startDate: data.startDate ? data.startDate.toDate() : new Date(),
      };
    });
    return creditCards;
  } catch (error) {
    console.error('Error getting credit cards:', error);
    throw error;
  }
};

export const updateCreditCard = async (id, updatedData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    const cardRef = doc(db, 'creditCards', id);
    const cardDoc = await getDoc(cardRef);
    
    if (cardDoc.exists()) {
      const currentData = cardDoc.data();
      const newBalance = updatedData.startingBalance !== undefined 
        ? Number(updatedData.startingBalance) 
        : Number(currentData.balance);

      await updateDoc(cardRef, {
        ...updatedData,
        balance: newBalance,
        limit: Number(updatedData.limit) || currentData.limit,
        startingBalance: Number(updatedData.startingBalance) || currentData.startingBalance,
        startDate: updatedData.startDate ? Timestamp.fromDate(new Date(updatedData.startDate)) : currentData.startDate,
        lastUpdated: Timestamp.fromDate(new Date())
      });
      console.log('Credit card updated successfully:', id);
    } else {
      console.error('Credit card not found:', id);
    }
  } catch (error) {
    console.error('Error updating credit card:', error);
    throw error;
  }
};

export const deleteCreditCard = async (id) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    const cardRef = doc(db, 'creditCards', id);
    await deleteDoc(cardRef);
    console.log('Credit card deleted successfully:', id);
  } catch (error) {
    console.error('Error deleting credit card:', error);
    throw error;
  }
};

const updateCreditCardBalance = async (cardId, amount, transactionType, isCardPayment) => {
  try {
    const cardRef = doc(db, 'creditCards', cardId);
    const cardDoc = await getDoc(cardRef);
    
    if (cardDoc.exists()) {
      const currentBalance = cardDoc.data().balance;
      let newBalance;
      
      if (isCardPayment) {
        newBalance = currentBalance - Number(amount);
      } else if (transactionType === 'expense') {
        newBalance = currentBalance + Number(amount);
      } else {
        // For income transactions on credit card (e.g., cashback rewards)
        newBalance = currentBalance - Number(amount);
      }

      await updateDoc(cardRef, { 
        balance: newBalance,
        lastUpdated: Timestamp.fromDate(new Date())
      });
      console.log('Credit card balance updated:', cardId, 'New balance:', newBalance);
    } else {
      console.error('Credit card not found:', cardId);
    }
  } catch (error) {
    console.error('Error updating credit card balance:', error);
    if (error.code === 'permission-denied') {
      console.error('Permission denied. Current user:', auth.currentUser?.uid);
      console.error('Card ID:', cardId);
      console.error('Transaction amount:', amount);
      console.error('Transaction type:', transactionType);
      console.error('Is card payment:', isCardPayment);
    }
    throw error;
  }
};

export const onCreditCardsUpdate = (callback) => {
  const user = auth.currentUser;
  if (!user) {
    console.error('No user logged in');
    return () => {};
  }

  const q = query(
    collection(db, 'creditCards'),
    where('userId', '==', user.uid)
  );

  return onSnapshot(q, (snapshot) => {
    const creditCards = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        balance: Number(data.balance) || 0,
        limit: Number(data.limit) || 0,
        startingBalance: Number(data.startingBalance) || 0,
        startDate: data.startDate ? data.startDate.toDate() : new Date(),
      };
    });
    callback(creditCards);
  });
};

export const addInvestment = async (investment) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    const investmentToSave = {
      ...investment,
      userId: user.uid,
      amount: Number(investment.amount),
      date: investment.date instanceof Date ? investment.date : new Date(investment.date)
    };

    const docRef = await addDoc(collection(db, 'investments'), investmentToSave);
    console.log('Investment added successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding investment:', error);
    throw error;
  }
};

export const getInvestments = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    const q = query(
      collection(db, 'investments'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const investments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      amount: Number(doc.data().amount),
      date: doc.data().date.toDate()
    }));
    console.log(`Retrieved ${investments.length} investments for user:`, user.uid);
    return investments;
  } catch (error) {
    console.error('Error getting investments:', error);
    throw error;
  }
};

export const updateInvestment = async (id, updatedData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    const investmentRef = doc(db, 'investments', id);
    await updateDoc(investmentRef, {
      ...updatedData,
      amount: Number(updatedData.amount),
      date: updatedData.date instanceof Date ? updatedData.date : new Date(updatedData.date)
    });
    console.log('Investment updated successfully:', id);
  } catch (error) {
    console.error('Error updating investment:', error);
    throw error;
  }
};

export const deleteInvestment = async (id) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    const investmentRef = doc(db, 'investments', id);
    await deleteDoc(investmentRef);
    console.log('Investment deleted successfully:', id);
  } catch (error) {
    console.error('Error deleting investment:', error);
    throw error;
  }
};

export const addLoan = async (loan) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    const loanToSave = {
      ...loan,
      userId: user.uid,
      amount: Number(loan.amount),
      interestRate: Number(loan.interestRate),
      startDate: loan.startDate instanceof Date ? loan.startDate : new Date(loan.startDate)
    };

    const docRef = await addDoc(collection(db, 'loans'), loanToSave);
    console.log('Loan added successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding loan:', error);
    throw error;
  }
};

export const getLoans = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    const q = query(
      collection(db, 'loans'),
      where('userId', '==', user.uid)
    );
    
    const snapshot = await getDocs(q);
    const loans = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      amount: Number(doc.data().amount),
      interestRate: Number(doc.data().interestRate),
      startDate: doc.data().startDate.toDate()
    }));
    console.log(`Retrieved ${loans.length} loans for user:`, user.uid);
    return loans;
  } catch (error) {
    console.error('Error getting loans:', error);
    throw error;
  }
};

export const updateLoan = async (id, updatedData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    const loanRef = doc(db, 'loans', id);
    await updateDoc(loanRef, {
      ...updatedData,
      amount: Number(updatedData.amount),
      interestRate: Number(updatedData.interestRate),
      startDate: updatedData.startDate instanceof Date ? updatedData.startDate : new Date(updatedData.startDate)
    });
    console.log('Loan updated successfully:', id);
  } catch (error) {
    console.error('Error updating loan:', error);
    throw error;
  }
};

export const deleteLoan = async (id) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    const loanRef = doc(db, 'loans', id);
    await deleteDoc(loanRef);
    console.log('Loan deleted successfully:', id);
  } catch (error) {
    console.error('Error deleting loan:', error);
    throw error;
  }
};

export const updateUserProfile = async (userData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      ...userData,
      initialCashBalance: Number(userData.initialCashBalance) || 0
    }, { merge: true });
    console.log('User profile updated successfully');
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      const defaultProfile = {
        email: user.email,
        initialCashBalance: 0,
        createdAt: Timestamp.now()
      };
      await setDoc(userRef, defaultProfile);
      return defaultProfile;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
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
  addCreditCard,
  getCreditCards,
  updateCreditCard,
  deleteCreditCard,
  onCreditCardsUpdate,
  addInvestment,
  getInvestments,
  updateInvestment,
  deleteInvestment,
  addLoan,
  getLoans,
  updateLoan,
  deleteLoan,
  updateUserProfile,
  getUserProfile,
};