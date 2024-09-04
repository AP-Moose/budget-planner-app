import { getCreditCards, getLoans } from '../FirebaseService';
import { calculateCreditCardBalance } from '../../utils/creditCardUtils';

const calculateMonthsBetweenDates = (startDate, endDate) => {
  return (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
};

export const generateDebtReductionProjection = async (transactions) => {
  console.log('Generating debt reduction projection');
  try {
    const creditCards = await getCreditCards();
    const loans = await getLoans();
    const report = { creditCards: {}, loans: {} };
    const currentDate = new Date();

    // Remove the date filters, processing all transactions up to the current point in time
    const totalMonthsCovered = calculateMonthsBetweenDates(transactions[0]?.date || new Date(), currentDate);

    // Process Credit Cards
    for (const card of creditCards) {
      const cardTransactions = transactions.filter(t => t.creditCardId === card.id);

      const totalPayments = cardTransactions
        .filter(t => t.isCardPayment)
        .reduce((sum, t) => sum + Number(t.amount), 0);
    
      const totalSpending = cardTransactions
        .filter(t => t.type === 'expense' && !t.isCardPayment)
        .reduce((sum, t) => sum + Number(t.amount), 0);
    
      const monthsCovered = totalMonthsCovered > 0 ? totalMonthsCovered : 1;
      const averageMonthlyPayment = totalPayments / monthsCovered;
      const averageMonthlySpending = totalSpending / monthsCovered;
      const netMonthlyPayment = averageMonthlyPayment - averageMonthlySpending;

      const currentBalance = calculateCreditCardBalance(card, transactions);

      report.creditCards[card.name] = {
        currentBalance: currentBalance ? currentBalance.toFixed(2) : '0.00',
        averageMonthlyPayment: averageMonthlyPayment.toFixed(2),
        averageMonthlySpending: averageMonthlySpending.toFixed(2),
        netMonthlyPayment: netMonthlyPayment.toFixed(2),
      };
    }

    // Process Loans
    for (const loan of loans) {
      const loanTransactions = transactions.filter(t => t.loanId === loan.id);

      const totalPayments = loanTransactions
        .filter(t => t.isLoanPayment)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const monthsCovered = loanTransactions.length > 0 ? loanTransactions.length : 1;
      const averageMonthlyPayment = monthsCovered > 0 ? totalPayments / monthsCovered : 0;

      const currentBalance = loan.currentBalance;

      let monthsToPayOff;
      if (averageMonthlyPayment > 0) {
        monthsToPayOff = Math.ceil(currentBalance / averageMonthlyPayment);
      } else {
        monthsToPayOff = 'N/A';
      }

      report.loans[loan.name] = {
        currentBalance: currentBalance,
        initialBalance: loan.initialAmount,
        interestRate: loan.interestRate,
        averageMonthlyPayment: averageMonthlyPayment.toFixed(2),
        monthsToPayOff: monthsToPayOff,
      };
    }

    console.log('Generated report:', report);
    return report;
  } catch (error) {
    console.error('Error in generateDebtReductionProjection:', error);
    throw error;
  }
};
