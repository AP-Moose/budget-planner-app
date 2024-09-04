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

    // Process Credit Cards
    for (const card of creditCards) {
      // Filter card-related transactions
      const cardTransactions = transactions.filter(t => t.creditCardId === card.id);

      // Total Payments: Transactions that are card payments
      const totalPayments = cardTransactions
        .filter(t => t.isCardPayment)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Total Spending: Transactions that are expenses but not card payments
      const totalSpending = cardTransactions
        .filter(t => t.type === 'expense' && !t.isCardPayment)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Find the first card payment to calculate months covered
      const firstPaymentDate = cardTransactions.length > 0 ? new Date(cardTransactions[cardTransactions.length - 1].date) : currentDate;
      const monthsSinceFirstPayment = calculateMonthsBetweenDates(firstPaymentDate, currentDate);

      const monthsCovered = monthsSinceFirstPayment > 0 ? monthsSinceFirstPayment : 1; // Avoid division by zero

      // Average Monthly Payment and Spending
      const averageMonthlyPayment = totalPayments / monthsCovered;
      const averageMonthlySpending = totalSpending / monthsCovered;

      // Net Monthly Payment: Payments minus spending
      const netMonthlyPayment = averageMonthlyPayment - averageMonthlySpending;

      // Current balance calculation
      const currentBalance = calculateCreditCardBalance(card, transactions);

      // Months to Pay Off: Taking into account net payments and interest rate
      let monthsToPayOff;
      if (netMonthlyPayment > 0) {
        const monthlyInterest = (card.interestRate / 100) / 12;
        monthsToPayOff = Math.ceil(
          Math.log(netMonthlyPayment / (netMonthlyPayment - currentBalance * monthlyInterest)) / Math.log(1 + monthlyInterest)
        );
      } else {
        monthsToPayOff = 'N/A';
      }

      report.creditCards[card.name] = {
        currentBalance: currentBalance ? currentBalance.toFixed(2) : '0.00',
        averageMonthlyPayment: averageMonthlyPayment.toFixed(2),
        averageMonthlySpending: averageMonthlySpending.toFixed(2),
        netMonthlyPayment: netMonthlyPayment.toFixed(2),
        monthsToPayOff: monthsToPayOff,
      };
    }

    // Process Loans (unchanged from previous update)
    for (const loan of loans) {
      const loanTransactions = transactions.filter(t => t.loanId === loan.id && t.isLoanPayment);

      const totalPayments = loanTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

      const firstPaymentDate = loanTransactions.length > 0 ? new Date(loanTransactions[loanTransactions.length - 1].date) : currentDate;
      const monthsSinceFirstPayment = calculateMonthsBetweenDates(firstPaymentDate, currentDate);

      const monthsCovered = monthsSinceFirstPayment > 0 ? monthsSinceFirstPayment : 1;
      const averageMonthlyPayment = totalPayments / monthsCovered;

      let monthsToPayOff;
      if (averageMonthlyPayment > 0) {
        const currentBalance = loan.currentBalance;
        const monthlyInterest = (loan.interestRate / 100) / 12;
        monthsToPayOff = Math.ceil(
          Math.log(averageMonthlyPayment / (averageMonthlyPayment - currentBalance * monthlyInterest)) / Math.log(1 + monthlyInterest)
        );
      } else {
        monthsToPayOff = 'N/A';
      }

      report.loans[loan.name] = {
        currentBalance: loan.currentBalance,
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

