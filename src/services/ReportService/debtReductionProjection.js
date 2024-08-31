import { getCreditCards, getLoans } from '../FirebaseService';
import { calculateCreditCardBalance } from '../../utils/creditCardUtils';

const calculateMonthsBetweenDates = (startDate, endDate) => {
  return (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
};

export const generateDebtReductionProjection = async (transactions, startDate, endDate) => {
  console.log('Generating debt reduction projection');
  try {
    const creditCards = await getCreditCards();
    const loans = await getLoans();
    const report = { creditCards: {}, loans: {} };
    const currentDate = new Date();

    // Convert startDate and endDate to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Calculate total months covered for the report period
    const totalMonthsCovered = calculateMonthsBetweenDates(start, currentDate);

    // Process Credit Cards
    for (const card of creditCards) {
      const cardTransactions = transactions.filter(t => 
        t.creditCardId === card.id && new Date(t.date) >= start && new Date(t.date) <= end
      );

      console.log(`Processing transactions for card: ${card.name}`);
      console.log(`Transactions: `, cardTransactions);

      const totalPayments = cardTransactions
        .filter(t => t.isCardPayment)
        .reduce((sum, t) => sum + Number(t.amount), 0);
    
      const totalSpending = cardTransactions
        .filter(t => t.type === 'expense' && !t.isCardPayment)
        .reduce((sum, t) => sum + Number(t.amount), 0);
    
      const monthsCovered = totalMonthsCovered > 0 ? totalMonthsCovered : 1; // Prevent division by zero
      const averageMonthlyPayment = totalPayments / monthsCovered;
      const averageMonthlySpending = totalSpending / monthsCovered;
    
      const netMonthlyPayment = averageMonthlyPayment - averageMonthlySpending;

      // Calculate current balance using the utility function
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
  const loanTransactions = transactions.filter(t => 
    t.loanId === loan.id && new Date(t.date) >= startDate && new Date(t.date) <= endDate
  );

  console.log(`Processing transactions for loan: ${loan.name}`);
  console.log(`Transactions: `, loanTransactions);

  const totalPayments = loanTransactions
    .filter(t => t.isLoanPayment)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Calculate months covered based on transactions
  const monthsCovered = loanTransactions.length > 0 ? loanTransactions.length : 1; // Avoid division by zero

  // Calculate average monthly payment
  const averageMonthlyPayment = monthsCovered > 0 ? totalPayments / monthsCovered : 0;

  // Set current balance from loan
  const currentBalance = loan.currentBalance;

  // Calculate months to pay off
  let monthsToPayOff;
  if (averageMonthlyPayment > 0) {
    monthsToPayOff = Math.ceil(currentBalance / averageMonthlyPayment);
  } else {
    monthsToPayOff = 'N/A'; // Or you can set it to 0 if needed
  }

  report.loans[loan.name] = {
    currentBalance: currentBalance,
    initialBalance: loan.initialAmount,
    interestRate: loan.interestRate,
    averageMonthlyPayment: averageMonthlyPayment.toFixed(2), // Capture payments made
    monthsToPayOff: monthsToPayOff // Now should have correct value
  };
}




    console.log('Generated report:', report);
    return report;
  } catch (error) {
    console.error('Error in generateDebtReductionProjection:', error);
    throw error;
  }
};
