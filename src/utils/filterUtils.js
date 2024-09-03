export const filterTransactionsByDate = (transactions, startDate, endDate) => {
  return transactions.filter(t => 
    new Date(t.date) >= startDate && new Date(t.date) <= endDate
  );
};


