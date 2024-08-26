import { getCreditCards, getInvestments, getLoanInformation, getUserProfile, getOtherAssets, getOtherLiabilities } from '../FirebaseService';
import { calculateTotalAssets, calculateTotalLiabilities, calculateNetWorth } from '../../utils/financialCalculations';

export const generateBalanceSheetReport = async (transactions, asOfDate) => {
  console.log('Generating balance sheet report');
  try {
    const creditCards = await getCreditCards();
    const investments = await getInvestments();
    const loans = await getLoanInformation();
    const userProfile = await getUserProfile();
    const otherAssets = await getOtherAssets();
    const otherLiabilities = await getOtherLiabilities();

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

    // Calculate other assets and liabilities
    const otherAssetValues = otherAssets.reduce((acc, asset) => {
      acc[asset.id] = asset.amount;
      return acc;
    }, {});

    const otherLiabilityValues = otherLiabilities.reduce((acc, liability) => {
      acc[liability.id] = liability.amount;
      return acc;
    }, {});

    // Calculate totals
    const totalAssets = calculateTotalAssets(cashBalance, investmentValues, otherAssetValues);
    const totalLiabilities = calculateTotalLiabilities(creditCardBalances, loanBalances, otherLiabilityValues);
    const netWorth = calculateNetWorth(totalAssets, totalLiabilities);

    return {
      asOfDate: asOfDate.toISOString(),
      assets: {
        cash: cashBalance,
        investments: investmentValues,
        otherAssets: otherAssetValues,
        total: totalAssets
      },
      liabilities: {
        creditCards: creditCardBalances,
        loans: loanBalances,
        otherLiabilities: otherLiabilityValues,
        total: totalLiabilities
      },
      netWorth: netWorth
    };
  } catch (error) {
    console.error('Error in generateBalanceSheetReport:', error);
    // Return a default structure even if there's an error
    return {
      asOfDate: asOfDate.toISOString(),
      assets: { cash: 0, investments: {}, otherAssets: {}, total: 0 },
      liabilities: { creditCards: {}, loans: {}, otherLiabilities: {}, total: 0 },
      netWorth: 0
    };
  }
};