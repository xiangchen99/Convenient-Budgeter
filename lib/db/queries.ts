import { getDb } from "./index";
import type {
  Budget,
  BudgetPeriod,
  Category,
  ExpenseTemplateWithCategory,
  TransactionWithCategory,
  WeeklyBudgetOverride,
} from "@/lib/types";

type TransactionRow = {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  occurred_on: string;
  split_days: number;
  weekly_budget_start: string | null;
  note: string | null;
  created_at: string;
  category_name: string | null;
  category_color: string | null;
};

type ExpenseTemplateRow = {
  id: string;
  user_id: string;
  name: string;
  category_id: string | null;
  amount: number;
  split_days: number;
  note: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category_name: string | null;
  category_color: string | null;
};

function mapTransactionRow(row: TransactionRow): TransactionWithCategory {
  return {
    id: row.id,
    user_id: row.user_id,
    category_id: row.category_id,
    amount: Number(row.amount),
    occurred_on: row.occurred_on,
    split_days: Number(row.split_days) || 1,
    weekly_budget_start: row.weekly_budget_start,
    note: row.note,
    created_at: row.created_at,
    category: row.category_id
      ? {
          id: row.category_id,
          name: row.category_name ?? "",
          color: row.category_color ?? "#16a34a",
        }
      : null,
  };
}

function mapExpenseTemplateRow(
  row: ExpenseTemplateRow
): ExpenseTemplateWithCategory {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    category_id: row.category_id,
    amount: Number(row.amount),
    split_days: Number(row.split_days) || 1,
    note: row.note,
    sort_order: Number(row.sort_order) || 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
    category: row.category_id
      ? {
          id: row.category_id,
          name: row.category_name ?? "",
          color: row.category_color ?? "#16a34a",
        }
      : null,
  };
}

export async function fetchCategories(userId: string): Promise<Category[]> {
  const db = await getDb();
  const result = await db
    .prepare(
      "SELECT id, user_id, name, color, created_at FROM categories WHERE user_id = ? ORDER BY name ASC"
    )
    .bind(userId)
    .all<Category>();

  return result.results ?? [];
}

export async function fetchBudgets(userId: string): Promise<Budget[]> {
  const db = await getDb();
  const result = await db
    .prepare(
      "SELECT id, user_id, period, amount, created_at, updated_at FROM budgets WHERE user_id = ? ORDER BY period ASC"
    )
    .bind(userId)
    .all<{
      id: string;
      user_id: string;
      period: string;
      amount: number;
      created_at: string;
      updated_at: string;
    }>();

  return (result.results ?? []).map((b) => ({
    ...b,
    period: b.period as BudgetPeriod,
    amount: Number(b.amount),
  }));
}

export async function fetchWeeklyBudgetOverride(
  userId: string,
  weekStart: string
): Promise<WeeklyBudgetOverride | null> {
  const db = await getDb();
  const result = await db
    .prepare(
      "SELECT id, user_id, week_start, amount, created_at, updated_at FROM weekly_budget_overrides WHERE user_id = ? AND week_start = ?"
    )
    .bind(userId, weekStart)
    .first<WeeklyBudgetOverride>();

  if (!result) return null;
  return {
    ...result,
    amount: Number(result.amount),
  };
}

export async function fetchExpenseTemplates(
  userId: string
): Promise<ExpenseTemplateWithCategory[]> {
  const db = await getDb();
  const result = await db
    .prepare(
      `SELECT t.id, t.user_id, t.name, t.category_id, t.amount, t.split_days, t.note, t.sort_order, t.created_at, t.updated_at,
              c.name as category_name, c.color as category_color
       FROM expense_templates t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = ?
       ORDER BY t.sort_order ASC, t.created_at ASC`
    )
    .bind(userId)
    .all<ExpenseTemplateRow>();

  return (result.results ?? []).map(mapExpenseTemplateRow);
}

export async function fetchTransactionsInRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<TransactionWithCategory[]> {
  const db = await getDb();
  const result = await db
    .prepare(
      `SELECT t.id, t.user_id, t.category_id, t.amount, t.occurred_on, t.split_days, t.weekly_budget_start, t.note, t.created_at,
              c.name as category_name, c.color as category_color
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = ? AND t.occurred_on >= ? AND t.occurred_on <= ?
       ORDER BY t.occurred_on DESC, t.created_at DESC`
    )
    .bind(userId, startDate, endDate)
    .all<TransactionRow>();

  return (result.results ?? []).map(mapTransactionRow);
}

export async function fetchCarryoverTransactions(
  userId: string,
  startDate: string,
  endDateExclusive: string
): Promise<TransactionWithCategory[]> {
  const db = await getDb();
  const result = await db
    .prepare(
      `SELECT t.id, t.user_id, t.category_id, t.amount, t.occurred_on, t.split_days, t.weekly_budget_start, t.note, t.created_at,
              c.name as category_name, c.color as category_color
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = ? AND t.occurred_on >= ? AND t.occurred_on < ? AND t.split_days > 1
       ORDER BY t.occurred_on DESC, t.created_at DESC`
    )
    .bind(userId, startDate, endDateExclusive)
    .all<TransactionRow>();

  return (result.results ?? []).map(mapTransactionRow);
}

export async function fetchWeeklyBudgetTransactions(
  userId: string,
  weekStart: string
): Promise<TransactionWithCategory[]> {
  const db = await getDb();
  const result = await db
    .prepare(
      `SELECT t.id, t.user_id, t.category_id, t.amount, t.occurred_on, t.split_days, t.weekly_budget_start, t.note, t.created_at,
              c.name as category_name, c.color as category_color
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = ? AND t.weekly_budget_start = ?
       ORDER BY t.occurred_on DESC, t.created_at DESC`
    )
    .bind(userId, weekStart)
    .all<TransactionRow>();

  return (result.results ?? []).map(mapTransactionRow);
}

export async function fetchMonthlyFilteredTransactions(
  userId: string,
  startDate: string,
  endDate: string,
  options?: { search?: string; categoryId?: string }
): Promise<TransactionWithCategory[]> {
  const db = await getDb();
  const conditions: string[] = [
    "t.user_id = ?",
    "t.occurred_on >= ?",
    "t.occurred_on <= ?",
  ];
  const params: unknown[] = [userId, startDate, endDate];

  if (options?.categoryId === "__none") {
    conditions.push("t.category_id IS NULL");
  } else if (options?.categoryId) {
    conditions.push("t.category_id = ?");
    params.push(options.categoryId);
  }

  if (options?.search) {
    conditions.push("LOWER(t.note) LIKE ?");
    params.push(`%${options.search.toLowerCase()}%`);
  }

  const query = `
    SELECT t.id, t.user_id, t.category_id, t.amount, t.occurred_on, t.split_days, t.weekly_budget_start, t.note, t.created_at,
           c.name as category_name, c.color as category_color
    FROM transactions t
    LEFT JOIN categories c ON c.id = t.category_id
    WHERE ${conditions.join(" AND ")}
    ORDER BY t.occurred_on DESC, t.created_at DESC
  `;

  const result = await db.prepare(query).bind(...params).all<TransactionRow>();
  return (result.results ?? []).map(mapTransactionRow);
}
