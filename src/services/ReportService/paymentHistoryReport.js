import { getCreditCards } from '../FirebaseService';

export const generatePaymentHistoryReport = async (transactions, startDate, endDate) => {
  console.log('Generating payment history report');
  try {
    const creditCards = await getCreditCards();
    const creditCardMap = creditCards.reduce((map, card) => {
      map[card.id] = card.name;
      return map;
    }, {});

    // Adjust start and end dates to cover the full day in UTC
    const adjustedStartDate = new Date(startDate);
    adjustedStartDate.setUTCHours(0, 0, 0, 0);
    
    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setUTCHours(23, 59, 59, 999);

    console.log('Adjusted Start Date:', adjustedStartDate.toISOString());
    console.log('Adjusted End Date:', adjustedEndDate.toISOString());

    // Filter transactions to only include credit card payments within the date range
    const creditCardPayments = transactions.filter(t => {
      const transactionDate = new Date(t.date); // Ensure it's treated as a Date object
      console.log('Transaction Date:', transactionDate.toISOString());
      return t.creditCard && 
             t.isCardPayment && 
             transactionDate >= adjustedStartDate && 
             transactionDate <= adjustedEndDate;
    });
    
    const paymentHistory = creditCardPayments.map(payment => ({
      date: new Date(payment.date).toLocaleDateString(), // Format the date
      amount: Number(payment.amount).toFixed(2),
      creditCardId: payment.creditCardId,
      creditCardName: creditCardMap[payment.creditCardId] || 'Unknown Card'
    }));

    console.log('Generated Payment History:', paymentHistory);

    return paymentHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error('Error in generatePaymentHistoryReport:', error);
    throw error;
  }
};
