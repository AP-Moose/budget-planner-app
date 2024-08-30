import { getCreditCards, getBalanceSheetItems, getUserProfile } from '../FirebaseService';
import { categorizeTransactions, calculateTotals } from '../../utils/reportUtils';
import { calculateTotalAssets, calculateTotalLiabilities, calculateNetWorth } from '../../utils/financialCalculations';

export const generateBalanceSheetReport = async (transactions, asOfDate) => {
  console.log('Generating balance sheet report');
  try {
    const creditCards = await getCreditCards();
    const balanceSheetItems = await getBalanceSheetItems();
    const userProfile = await getUserProfile();

    // Categorize transactions and calculate totals
    const categorizedTransactions = categorizeTransactions(transactions);
    const totals = calculateTotals(categorizedTransactions);

    // Calculate cash balance
    let initialCashBalance = userProfile?.initialCashBalance || 0;
    console.log('Initial cash balance:', initialCashBalance);

    const totalIncome = totals.totalRegularIncome + totals.totalCreditCardIncome;
    const totalCashOutflow = totals.totalRegularExpenses + totals.totalCreditCardPayments + totals.totalLoanPayments;
    const netCashFlow = totalIncome - totalCashOutflow;

    console.log('Total income:', totalIncome);
    console.log('Total cash outflow:', totalCashOutflow);
    console.log('Net cash flow:', netCashFlow);

    const cashBalance = initialCashBalance + netCashFlow;
    console.log('Final cash balance:', cashBalance);

    // Calculate credit card balances
    const creditCardBalances = creditCards.reduce((acc, card) => {
      acc[card.name] = card.balance;
      return acc;
    }, {});

    // Update credit card balances based on transactions
    transactions.forEach(t => {
      if (t.creditCard && t.creditCardId && new Date(t.date) <= asOfDate) {
        const card = creditCards.find(c => c.id === t.creditCardId);
        if (card) {
          if (t.isCardPayment) {
            creditCardBalances[card.name] = (creditCardBalances[card.name] || 0) - Number(t.amount);
          } else if (t.type === 'expense') {
            creditCardBalances[card.name] = (creditCardBalances[card.name] || 0) + Number(t.amount);
          }
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
      netWorth: netWorth,
      cashFlowDetails: {
        totalIncome,
        totalCashOutflow,
        netCashFlow
      }
    };
  } catch (error) {
    console.error('Error in generateBalanceSheetReport:', error);
    throw error;
  }
};