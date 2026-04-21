/**
 * Computes net balances for all members in a group from a list of expenses.
 * Returns: { userId: netAmount } — positive means "is owed", negative means "owes"
 */
export function computeNetBalances(expenses, members) {
  const balances = {};
  members.forEach((m) => {
    balances[m.id] = 0;
  });

  for (const expense of expenses) {
    const payerId = expense.paidBy.id;

    if (!expense.items || expense.items.length === 0) {
      // Fallback: equal split across all members
      const share = expense.totalAmount / members.length;
      members.forEach((m) => {
        if (m.id !== payerId) {
          balances[payerId] = (balances[payerId] || 0) + share;
          balances[m.id] = (balances[m.id] || 0) - share;
        }
      });
    } else {
      for (const item of expense.items) {
        if (!item.participants || item.participants.length === 0) continue;
        const share = item.price / item.participants.length;
        for (const participant of item.participants) {
          if (participant.id !== payerId) {
            balances[payerId] = (balances[payerId] || 0) + share;
            balances[participant.id] = (balances[participant.id] || 0) - share;
          }
        }
      }
    }
  }

  return balances;
}

/**
 * Minimizes the number of settlement transactions using a greedy algorithm.
 * Returns: [{ from: userId, to: userId, amount: number }]
 */
export function minimizeTransactions(balances) {
  const creditors = [];
  const debtors = [];

  Object.entries(balances).forEach(([userId, amount]) => {
    const rounded = Math.round(amount * 100) / 100;
    if (rounded > 0.01) creditors.push({ userId, amount: rounded });
    else if (rounded < -0.01) debtors.push({ userId, amount: -rounded });
  });

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];

  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const credit = creditors[i];
    const debt = debtors[j];
    const settle = Math.min(credit.amount, debt.amount);

    transactions.push({
      from: debt.userId,
      to: credit.userId,
      amount: Math.round(settle * 100) / 100,
    });

    credit.amount -= settle;
    debt.amount -= settle;

    if (credit.amount < 0.01) i++;
    if (debt.amount < 0.01) j++;
  }

  return transactions;
}

/**
 * Returns each member's total spend share within a group's expenses.
 */
export function computeMemberShares(expenses, members) {
  const shares = {};
  members.forEach((m) => {
    shares[m.id] = { paid: 0, owes: 0 };
  });

  for (const expense of expenses) {
    const payerId = expense.paidBy.id;
    shares[payerId] = shares[payerId] || { paid: 0, owes: 0 };
    shares[payerId].paid += expense.totalAmount;

    if (!expense.items || expense.items.length === 0) {
      const share = expense.totalAmount / members.length;
      members.forEach((m) => {
        shares[m.id] = shares[m.id] || { paid: 0, owes: 0 };
        shares[m.id].owes += share;
      });
    } else {
      for (const item of expense.items) {
        if (!item.participants || item.participants.length === 0) continue;
        const share = item.price / item.participants.length;
        for (const p of item.participants) {
          shares[p.id] = shares[p.id] || { paid: 0, owes: 0 };
          shares[p.id].owes += share;
        }
      }
    }
  }

  return shares;
}
