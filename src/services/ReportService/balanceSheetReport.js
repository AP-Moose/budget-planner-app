import { getCreditCards, getInvestments, getLoans, getUserProfile } from '../FirebaseService';

export const generateBalanceSheetReport = async (transactions, asOfDate) => {
  console.log('Generating balance sheet report');
  try {
    const creditCards = await getCreditCards();
    const investments = await getInvestments();
    const loans = await getLoans();
    const userProfile = await getUserProfile();

    // Calculate cash balance
    let cashBalance = userProfile?.initialCashBalance || 0;
    const cashTransactions = transactions.filter(t => !t.creditCard);
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
      if (t.creditCard && t.creditCardId) {
        if (t.isCardPayment) {
          creditCardBalances[t.creditCardId] = (creditCardBalances[t.creditCardId] || 0) - Number(t.amount);
        } else if (t.type === 'expense') {
          creditCardBalances[t.creditCardId] = (creditCardBalances[t.creditCardId] || 0) + Number(t.amount);
        }
      }
    });

    // Calculate investment values
    const investmentValues = investments.reduce((acc, investment) => {
      acc[investment.id] = investment.amount;
      return acc;
    }, {});

    // Calculate loan balances
    const loanBalances = loans.reduce((acc, loan) => {
      acc[loan.id] = loan.amount;
      return acc;
    }, {});

    // Calculate totals
    const totalAssets = cashBalance + Object.values(investmentValues).reduce((sum, value) => sum + value, 0);
    const totalLiabilities = Object.values(creditCardBalances).reduce((sum, balance) => sum + balance, 0) +
                             Object.values(loanBalances).reduce((sum, balance) => sum + balance, 0);
    const netWorth = totalAssets - totalLiabilities;

    return {
      asOfDate: asOfDate.toISOString(),
      assets: {
        cash: cashBalance,
        investments: investmentValues,
        total: totalAssets
      },
      liabilities: {
        creditCards: creditCardBalances,
        loans: loanBalances,
        total: totalLiabilities
      },
      netWorth: netWorth
    };
  } catch (error) {
    console.error('Error in generateBalanceSheetReport:', error);
    // Return a default structure even if there's an error
    return {
      asOfDate: asOfDate.toISOString(),
      assets: { cash: 0, investments: {}, total: 0 },
      liabilities: { creditCards: {}, loans: {}, total: 0 },
      netWorth: 0
    };
  }
};