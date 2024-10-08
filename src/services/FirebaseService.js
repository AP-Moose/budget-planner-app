import { initializeApp, } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  updateDoc, 
  deleteDoc, 
  doc, 
  where,
  writeBatch, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { firebaseConfig } from '../config';
import { getCategoryType } from '../utils/categories';
import { calculateCreditCardBalance } from '../utils/creditCardUtils';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const sanitizeCategory = (category) => {
  return category.replace(/[^a-zA-Z0-9]/g, '_');
};

export const updateBudgetGoal = async (category, updatedData, months = []) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('No user logged in');
      throw new Error('No user logged in');
    }

    const sanitizedCategory = sanitizeCategory(category);

    for (const month of months) {
      const goalDocId = `${user.uid}_${sanitizedCategory}_${updatedData.year}_${month}`;
      console.log('Generated Document ID:', goalDocId); // Log the generated document ID

      const goalRef = doc(db, 'budgetGoals', goalDocId);
      await setDoc(goalRef, {
        ...updatedData,
        userId: user.uid,
        category: category,
        month: month,
        amount: Number(updatedData.amount),
      }, { merge: true });

      console.log(`Budget goal updated for ${category} in month: ${month}`);
    }

    console.log('Budget goal updated successfully for category:', category, 'for months:', months);
  } catch (error) {
    console.error('Error updating budget goal:', error.message);
    throw error; // Rethrow the error to handle it in the calling function
  }
};




export const onBudgetGoalsUpdate = (year, callback) => {
  const user = auth.currentUser;
  if (!user) {
    console.error('No user logged in');
    return () => {};
  }

  let q = query(
    collection(db, 'budgetGoals'),
    where('userId', '==', user.uid),
    where('year', '==', year)
  );

  return onSnapshot(q, (snapshot) => {
    const budgetGoals = snapshot.docs.map(doc => ({
      id: doc.id.split('_')[1],
      ...doc.data(),
      amount: Number(doc.data().amount)
    }));
    callback(budgetGoals);
  });
};



export const deleteBudgetGoal = async (category, year, month) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('No user logged in');
      throw new Error('No user logged in');
    }

    const sanitizedCategory = sanitizeCategory(category);
    const goalRef = doc(db, 'budgetGoals', `${user.uid}_${sanitizedCategory}_${year}_${month}`);
    
    const goalDoc = await getDoc(goalRef);
    if (goalDoc.exists()) {
      await deleteDoc(goalRef);
      console.log(`Budget goal for ${category} in ${year}-${month} deleted successfully`);
    } else {
      console.log(`No budget goal found for ${category} in ${year}-${month}, nothing to delete`);
    }
  } catch (error) {
    console.error('Error deleting budget goal:', error);
    throw error;
  }
};



export const getBudgetGoals = async (year, month) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    if (!year || !month) {
      throw new Error('Year and month must be provided');
    }

    const q = query(
      collection(db, 'budgetGoals'),
      where('userId', '==', user.uid),
      where('year', '==', year),
      where('month', '==', month)
    );

    const snapshot = await getDocs(q);
    
    // Return an empty array if no results are found
    if (snapshot.empty) {
      return [];
    }

    const budgetGoals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      amount: Number(doc.data().amount)
    }));

    return budgetGoals;
  } catch (error) {
    console.error('Error getting budget goals:', error);
    throw error;
  }
};



export const clearAllBudgetGoals = async (year = null) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    console.log(`Clearing all budget goals ${year !== null ? `for year: ${year}` : 'for all-time'}`);

    const goalsRef = collection(db, 'budgetGoals');
    let q;
    
    if (year !== null) {
      q = query(goalsRef, where('userId', '==', user.uid), where('year', '==', year));
    } else {
      q = query(goalsRef, where('userId', '==', user.uid));
    }

    const snapshot = await getDocs(q);

    const batch = writeBatch(db); // Initialize a write batch
    snapshot.docs.forEach((doc) => {
      console.log(`Deleting document with ID: ${doc.id}`);
      batch.delete(doc.ref); // Add each document to the batch delete
    });

    await batch.commit(); // Commit the batch delete
    console.log(year !== null ? `Cleared all budget goals for the year ${year}` : 'Cleared all budget goals for all time');
  } catch (error) {
    console.error('Error clearing budget goals:', error);
    throw error;
  }
};

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
      isCardPayment: Boolean(transaction.isCardPayment),
      isLoanPayment: Boolean(transaction.isLoanPayment),
      loanId: transaction.loanId || null,
      isCashback: Boolean(transaction.isCashback)
    };

    console.log('Attempting to save transaction:', transactionToSave);
    const docRef = await addDoc(collection(db, 'transactions'), transactionToSave);
    console.log('Transaction saved successfully with ID:', docRef.id);

    if (transactionToSave.creditCard && transactionToSave.creditCardId) {
      await updateCreditCardBalance(transactionToSave.creditCardId);
    }

    if (transactionToSave.isLoanPayment && transactionToSave.loanId) {
      await updateLoanBalanceInDatabase(transactionToSave.loanId);
    }

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
      date: doc.data().date.toDate(),
      creditCard: Boolean(doc.data().creditCard),
      isCardPayment: Boolean(doc.data().isCardPayment),
      creditCardId: doc.data().creditCardId || null // Ensure this field is captured
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
      throw new Error('No user logged in');
    }

    const transactionRef = doc(db, 'transactions', id);
    const oldTransactionDoc = await getDoc(transactionRef);
    const oldTransactionData = oldTransactionDoc.data();

    if (updatedData.category) {
      updatedData.type = getCategoryType(updatedData.category);
    }
    if (updatedData.creditCard !== undefined) {
      updatedData.creditCard = Boolean(updatedData.creditCard);
    }
    if (updatedData.isCardPayment !== undefined) {
      updatedData.isCardPayment = Boolean(updatedData.isCardPayment);
    }

    // Update the transaction
    await updateDoc(transactionRef, updatedData);

    // If this is a loan payment, update the loan balance
    if (updatedData.isLoanPayment && updatedData.loanId) {
      await updateLoanBalanceInDatabase(updatedData.loanId);
    }

    // If the old transaction was a loan payment but the updated one isn't,
    // or if the loan ID has changed, update the old loan's balance as well
    if (oldTransactionData.isLoanPayment && oldTransactionData.loanId &&
        (!updatedData.isLoanPayment || updatedData.loanId !== oldTransactionData.loanId)) {
      await updateLoanBalanceInDatabase(oldTransactionData.loanId);
    }

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
      throw new Error('No user logged in');
    }

    const transactionRef = doc(db, 'transactions', id);
    const transactionDoc = await getDoc(transactionRef);
    
    if (transactionDoc.exists()) {
      const transactionData = transactionDoc.data();
      
      // If it's a loan payment, update the loan balance
      if (transactionData.isLoanPayment && transactionData.loanId) {
        await deleteDoc(transactionRef);
        await updateLoanBalanceInDatabase(transactionData.loanId);
      } else {
        await deleteDoc(transactionRef);
      }

      console.log('Transaction deleted successfully:', id);
    } else {
      throw new Error('Transaction not found');
    }
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

export const addCreditCard = async (cardData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    const transactions = await getTransactions();  // Fetch transactions
    const newBalance = calculateCreditCardBalance({ ...cardData }, transactions);  // Calculate the balance

    const cardToSave = {
      ...cardData,
      userId: user.uid,
      balance: newBalance,
      limit: Number(cardData.limit) || 0,
      startingBalance: Number(cardData.startingBalance) || 0,
      startDate: Timestamp.fromDate(cardData.startDate || new Date()),
      interestRate: Number(cardData.interestRate) || 0, // Save interest rate
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
    if (!user) throw new Error('No user logged in');

    const creditCardsRef = collection(db, 'creditCards');
    const q = query(creditCardsRef, where('userId', '==', user.uid));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      balance: doc.data().balance,
      limit: doc.data().limit,
      startingBalance: doc.data().startingBalance, // Include starting balance
      startDate: doc.data().startDate ? doc.data().startDate.toDate() : new Date(), // Convert Firestore Timestamp to Date
    }));
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
      const transactions = await getTransactions();
      const card = {
        id,
        ...currentData,
        ...updatedData,
        startingBalance: updatedData.startingBalance !== undefined ? updatedData.startingBalance : currentData.startingBalance,
        startDate: updatedData.startDate ? new Date(updatedData.startDate) : currentData.startDate,
      };
      const newBalance = calculateCreditCardBalance(card, transactions);

      await updateDoc(cardRef, {
        ...updatedData,
        balance: newBalance,  // Store the new balance
        limit: updatedData.limit !== undefined ? updatedData.limit : currentData.limit,
        startingBalance: card.startingBalance,
        startDate: Timestamp.fromDate(card.startDate),
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

const updateCreditCardBalance = async (cardId) => {
  try {
    const cardRef = doc(db, 'creditCards', cardId);
    const cardDoc = await getDoc(cardRef);
    
    if (cardDoc.exists()) {
      const card = cardDoc.data();
      const transactions = await getTransactions();
      const newBalance = calculateCreditCardBalance({...card, id: cardId}, transactions);

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

  return onSnapshot(q, async (snapshot) => {
    const transactions = await getTransactions();
    const creditCards = snapshot.docs.map(doc => {
      const data = doc.data();
      const card = {
        id: doc.id,
        ...data,
        limit: Number(data.limit) || 0,
        startingBalance: Number(data.startingBalance) || 0,
        startDate: data.startDate ? data.startDate.toDate() : new Date(),
      };
      card.balance = calculateCreditCardBalance(card, transactions);
      return card;
    });
    callback(creditCards);
  });
};

export const getInvestments = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    const investmentsRef = collection(db, 'investments');
    const q = query(investmentsRef, where('userId', '==', user.uid));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting investments:', error);
    throw error;
  }
};

export const updateInvestment = async (investmentData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    const investmentRef = investmentData.id 
      ? doc(db, 'investments', investmentData.id)
      : doc(collection(db, 'investments'));
    
    await setDoc(investmentRef, { 
      ...investmentData, 
      userId: user.uid,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return investmentRef.id;
  } catch (error) {
    console.error('Error updating investment:', error);
    throw error;
  }
};

export const getLoanInformation = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    const loansRef = collection(db, 'loans');
    const q = query(loansRef, where('userId', '==', user.uid));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting loan information:', error);
    throw error;
  }
};

export const updateLoanInformation = async (loanData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    const loanRef = loanData.id 
      ? doc(db, 'loans', loanData.id)
      : doc(collection(db, 'loans'));
    
    await setDoc(loanRef, { 
      ...loanData, 
      userId: user.uid,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return loanRef.id;
  } catch (error) {
    console.error('Error updating loan information:', error);
    throw error;
  }
};

export const getOtherAssets = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    const assetsRef = collection(db, 'otherAssets');
    const q = query(assetsRef, where('userId', '==', user.uid));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting other assets:', error);
    throw error;
  }
};

export const updateOtherAsset = async (assetData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    const assetRef = assetData.id 
      ? doc(db, 'otherAssets', assetData.id)
      : doc(collection(db, 'otherAssets'));
    
    await setDoc(assetRef, { 
      ...assetData, 
      userId: user.uid,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return assetRef.id;
  } catch (error) {
    console.error('Error updating other asset:', error);
    throw error;
  }
};

export const getOtherLiabilities = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    const liabilitiesRef = collection(db, 'otherLiabilities');
    const q = query(liabilitiesRef, where('userId', '==', user.uid));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting other liabilities:', error);
    throw error;
  }
};

export const updateOtherLiability = async (liabilityData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    const liabilityRef = liabilityData.id 
      ? doc(db, 'otherLiabilities', liabilityData.id)
      : doc(collection(db, 'otherLiabilities'));
    
    await setDoc(liabilityRef, { 
      ...liabilityData, 
      userId: user.uid,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return liabilityRef.id;
  } catch (error) {
    console.error('Error updating other liability:', error);
    throw error;
  }
};

export const getUserProfile = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    const userProfileRef = doc(db, 'users', user.uid);
    const userProfileDoc = await getDoc(userProfileRef);

    if (userProfileDoc.exists()) {
      return userProfileDoc.data();
    } else {
      return { initialCashBalance: 0 };
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (profileData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    const userProfileRef = doc(db, 'users', user.uid);
    await setDoc(userProfileRef, profileData, { merge: true });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const getBalanceSheetItems = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    const balanceSheetRef = collection(db, 'balanceSheet');
    const q = query(balanceSheetRef, where('userId', '==', user.uid));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting balance sheet items:', error);
    throw error;
  }
};

export const updateBalanceSheetItem = async (itemData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    const itemRef = itemData.id 
      ? doc(db, 'balanceSheet', itemData.id)
      : doc(collection(db, 'balanceSheet'));
    
    let dataToSave = { 
      ...itemData, 
      userId: user.uid,
      updatedAt: serverTimestamp()
    };

    // If it's a new loan or updating a loan
    if (itemData.category === 'Loan' && itemData.type === 'Liability') {
      dataToSave = {
        ...dataToSave,
        initialAmount: itemData.id ? itemData.initialAmount : itemData.amount, // Keep initial amount for existing loans
        interestRate: itemData.interestRate || null
      };
    }

    await setDoc(itemRef, dataToSave, { merge: true });
    
    console.log('Balance sheet item updated:', itemRef.id);
    return itemRef.id;
  } catch (error) {
    console.error('Error updating balance sheet item:', error);
    throw error;
  }
};

export const deleteBalanceSheetItem = async (itemId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    await deleteDoc(doc(db, 'balanceSheet', itemId));
  } catch (error) {
    console.error('Error deleting balance sheet item:', error);
    throw error;
  }
};

export const onBalanceSheetUpdate = (callback) => {
  const user = auth.currentUser;
  if (!user) {
    console.error('No user logged in');
    return () => {};
  }

  const q = query(
    collection(db, 'balanceSheet'),
    where('userId', '==', user.uid)
  );

  return onSnapshot(q, (snapshot) => {
    const balanceSheetItems = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(balanceSheetItems);
  });
};

export const updateLoanBalance = async (loanId, amount) => {
  try {
    const loanRef = doc(db, 'balanceSheet', loanId);
    const loanDoc = await getDoc(loanRef);
    
    if (loanDoc.exists()) {
      const loanData = loanDoc.data();
      const currentBalance = parseFloat(loanData.amount);
      const newBalance = currentBalance - parseFloat(amount);

      await updateDoc(loanRef, { 
        amount: newBalance,
        updatedAt: serverTimestamp()
      });
      console.log('Loan balance updated:', loanId, 'New balance:', newBalance);
    } else {
      console.error('Loan not found:', loanId);
    }
  } catch (error) {
    console.error('Error updating loan balance:', error);
    throw error;
  }
};

export const getLoans = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    const loansQuery = query(
      collection(db, 'balanceSheet'),
      where('userId', '==', user.uid),
      where('type', '==', 'Liability'),  // Ensure the type is Liability
      where('category', '==', 'Loan')    // Ensure the category is Loan
    );

    const loansSnapshot = await getDocs(loansQuery);

    const loans = loansSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      currentBalance: doc.data().amount // Use the amount field as the current balance
    }));

    console.log('Fetched loans:', loans);
    return loans;
  } catch (error) {
    console.error('Error fetching loans:', error);
    throw error;
  }
};


export const addLoan = async (loanData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    const loanToSave = {
      ...loanData,
      userId: user.uid,
      category: 'Loan',  // Ensure the category is set to 'Loan'
      type: 'Liability', // Ensure the type is set to 'Liability'
      createdAt: serverTimestamp(), // Optional: Add a timestamp for when the loan is created
    };

    const loanRef = await addDoc(collection(db, 'balanceSheet'), loanToSave); // Use balanceSheet collection
    console.log('Loan added successfully with ID:', loanRef.id);
    return loanRef.id; // Return the newly created loan's ID
  } catch (error) {
    console.error('Error adding loan:', error);
    throw new Error(`Failed to add loan: ${error.message}`);
  }
};

export const updateLoanBalanceInDatabase = async (loanId) => {
  try {
    const loanRef = doc(db, 'balanceSheet', loanId);
    const loanDoc = await getDoc(loanRef);
    
    if (loanDoc.exists()) {
      const loanData = loanDoc.data();
      const initialAmount = loanData.initialAmount ? parseFloat(loanData.initialAmount) : 0;

      // Get all loan payment transactions for this loan
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', loanData.userId),
        where('isLoanPayment', '==', true),
        where('loanId', '==', loanId)
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const loanPayments = transactionsSnapshot.docs.map(doc => doc.data());

      // Calculate the total payments
      const totalPayments = loanPayments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);

      // Calculate the new balance
      const newBalance = initialAmount - totalPayments;

      // Ensure balance is valid before updating
      if (!isNaN(newBalance)) {
        await updateDoc(loanRef, { 
          amount: newBalance,
          updatedAt: serverTimestamp()
        });
        console.log('Loan balance updated in database:', loanId, 'New balance:', newBalance);
      } else {
        console.error('Error calculating new balance: NaN');
      }
    } else {
      console.error('Loan not found:', loanId);
    }
  } catch (error) {
    console.error('Error updating loan balance in database:', error);
    throw error;
  }
};

export const onTransactionsUpdate = (callback) => {
  const user = auth.currentUser;
  if (!user) {
    console.error('No user logged in');
    return () => {};
  }

  const q = query(
    collection(db, 'transactions'),
    where('userId', '==', user.uid),
    orderBy('date', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      amount: Number(doc.data().amount),
      date: doc.data().date.toDate(),
      creditCard: Boolean(doc.data().creditCard),
      isCardPayment: Boolean(doc.data().isCardPayment),
      creditCardId: doc.data().creditCardId || null // Ensure this field is captured
    }));
    callback(transactions);
  });
};

export const onLoansUpdate = (callback) => {
  const user = auth.currentUser;
  if (!user) {
    console.error('No user logged in');
    return () => {};
  }

  const loansQuery = query(
    collection(db, 'balanceSheet'),
    where('userId', '==', user.uid),
    where('type', '==', 'Liability'),  // Ensure it's a liability
    where('category', '==', 'Loan')    // Ensure it's categorized as a loan
  );

  return onSnapshot(loansQuery, (snapshot) => {
    const loans = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      currentBalance: doc.data().amount // Assuming the balance is stored in the "amount" field
    }));
    callback(loans); // Send the updated loans list to the provided callback
  });
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
  getInvestments,
  updateInvestment,
  getLoanInformation,
  updateLoanInformation,
  getOtherAssets,
  updateOtherAsset,
  getOtherLiabilities,
  updateOtherLiability,
  getUserProfile,
  updateUserProfile,
  getBalanceSheetItems,
  updateBalanceSheetItem,
  deleteBalanceSheetItem,
  getLoans,
  updateLoanBalance,
  onBalanceSheetUpdate,
  updateLoanBalanceInDatabase,
  clearAllBudgetGoals,
  deleteBudgetGoal,
  onBudgetGoalsUpdate,
  addLoan,
  onTransactionsUpdate,
  onLoansUpdate,
};
