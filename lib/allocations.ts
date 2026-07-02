import { formatLocalDate, parseLocalDate } from "@/lib/dates";
import type { Category, TransactionWithCategory } from "@/lib/types";

export type TransactionAllocation = {
  date: string;
  amount: number;
  category: Pick<Category, "id" | "name" | "color"> | null;
  transaction: TransactionWithCategory;
};

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function toCents(amount: number | string) {
  return Math.round(Number(amount) * 100);
}

function fromCents(cents: number) {
  return Math.round(cents) / 100;
}

export function getTransactionAllocations(
  transaction: TransactionWithCategory
): TransactionAllocation[] {
  const start = parseLocalDate(transaction.occurred_on);
  if (!start) return [];

  const splitDays = Math.min(Math.max(transaction.split_days || 1, 1), 365);
  const totalCents = toCents(transaction.amount);
  const baseCents = Math.trunc(totalCents / splitDays);
  const remainderCents = totalCents % splitDays;

  return Array.from({ length: splitDays }, (_, index) => {
    const cents = baseCents + (index < remainderCents ? 1 : 0);
    return {
      date: formatLocalDate(addDays(start, index)),
      amount: fromCents(cents),
      category: transaction.category,
      transaction,
    };
  });
}

export function getTransactionAllocationsInRange(
  transactions: TransactionWithCategory[],
  startStr: string,
  endStr: string
) {
  return transactions
    .flatMap((transaction) => getTransactionAllocations(transaction))
    .filter((allocation) => allocation.date >= startStr && allocation.date <= endStr);
}

export function sumAllocations(allocations: Pick<TransactionAllocation, "amount">[]) {
  return Math.round(
    allocations.reduce((sum, allocation) => sum + allocation.amount, 0) * 100
  ) / 100;
}

export function sumWeeklyBudgetSpending(
  transactions: TransactionWithCategory[],
  weekStartStr: string,
  weekEndStr: string
) {
  const normalTransactions = transactions.filter(
    (transaction) => !transaction.weekly_budget_start
  );
  const carriedTransactions = transactions.filter(
    (transaction) => transaction.weekly_budget_start === weekStartStr
  );

  return sumAllocations([
    ...getTransactionAllocationsInRange(
      normalTransactions,
      weekStartStr,
      weekEndStr
    ),
    ...carriedTransactions.map((transaction) => ({
      amount: Number(transaction.amount),
    })),
  ]);
}
