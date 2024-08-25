import { getCreditCards } from '../FirebaseService';

export const generatePaymentHistoryReport = async (transactions) => {
  console.log('Generating payment history report');
  try {
    const creditCards = await getCreditCards();
    const creditCardMap = creditCards.reduce((map, card) => {
      map[card.id] = card.name;
      return map;
    }, {});

    const creditCardPayments = transactions.filter(t => t.creditCard && t.isCardPayment);
    
    const paymentHistory = creditCardPayments.map(payment => ({
      date: new Date(payment.date).toLocaleDateString(),
      amount: Number(payment.amount).toFixed(2),
      creditCardId: payment.creditCardId,
      creditCardName: creditCardMap[payment.creditCardId] || 'Unknown Card'
    }));

    return paymentHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error('Error in generatePaymentHistoryReport:', error);
    throw error;
  }
};