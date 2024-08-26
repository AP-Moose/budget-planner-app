import { getCreditCards, getBalanceSheetItems, getUserProfile } from '../FirebaseService';
import { calculateTotalAssets, calculateTotalLiabilities, calculateNetWorth } from '../../utils/financialCalculations';

export const generateBalanceSheetReport = async (transactions, asOfDate) => {
  console.log('Generating balance sheet report');
  try {
    const creditCards = await getCreditCards();
    const balanceSheetItems = await getBalanceSheetItems();
    const userProfile = await getUserProfile();

    // Calculate cash balance
    let cashBalance = userProfile?.initialCashBalance || 0;
    const cashTransactions = transactions.filter(t => !t.creditCard && new Date(t.date) <= asOfDate);
    cashBalance += cashTransactions.reduce((sum, t) => {
      return t.type === 'income' ? sum + Number(t.amount) : sum - Number(t.amount);
    }, 0);

    // Calculate credit card balances
    const creditCardBalances = creditCards.reduce((acc, card) => {
      acc[card.name] = card.balance;
      return acc;
    }, {});

    // Update credit card balances based on transactions
    transactions.forEach(t => {
      if (t.creditCard && t.creditCardId && new Date(t.date) <= asOfDate) {
        if (t.isCardPayment) {
          creditCardBalances[t.creditCardId] = (creditCardBalances[t.creditCardId] || 0) - Number(t.amount);
        } else if (t.type === 'expense') {
          creditCardBalances[t.creditCardId] = (creditCardBalances[t.creditCardId] || 0) + Number(t.amount);
        }
      }
    });

    // Categorize balance sheet items
    const assets = {investments: {}, otherAssets: {}};
    const liabilities = {loans: {}, otherLiabilities: {}};

    balanceSheetItems.forEach(item => {
      if (item.type === 'Asset') {
        if (item.category === 'Investment') {
          assets.investments[item.name] = Number(item.amount);
        } else {
          assets.otherAssets[item.name] = Number(item.amount);
        }
      } else if (item.type === 'Liability') {
        if (item.category === 'Loan') {
          liabilities.loans[item.name] = Number(item.amount);
        } else {
          liabilities.otherLiabilities[item.name] = Number(item.amount);
        }
      }
    });

    // Calculate totals
    const totalAssets = calculateTotalAssets(cashBalance, assets.investments, assets.otherAssets);
    const totalLiabilities = calculateTotalLiabilities(creditCardBalances, liabilities.loans, liabilities.otherLiabilities);
    const netWorth = calculateNetWorth(totalAssets, totalLiabilities);

    return {
      asOfDate: asOfDate.toISOString(),
      assets: {
        cash: cashBalance,
        investments: assets.investments,
        otherAssets: assets.otherAssets,
        total: totalAssets
      },
      liabilities: {
        creditCards: creditCardBalances,
        loans: liabilities.loans,
        otherLiabilities: liabilities.otherLiabilities,
        total: totalLiabilities
      },
      netWorth: netWorth
    };
  } catch (error) {
    console.error('Error in generateBalanceSheetReport:', error);
    throw error;
  }
};