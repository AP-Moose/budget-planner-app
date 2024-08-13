export const generatePaymentHistoryReport = (transactions) => {
    console.log('Generating payment history report');
    try {
      const creditCardPayments = transactions.filter(t => t.creditCard && t.isCardPayment);
      
      const paymentHistory = creditCardPayments.map(payment => ({
        date: new Date(payment.date).toLocaleDateString(),
        amount: payment.amount,
        creditCardId: payment.creditCardId,
        creditCardName: payment.creditCardName || 'Unknown Card'
      }));
  
      return paymentHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.error('Error in generatePaymentHistoryReport:', error);
      throw error;
    }
  };