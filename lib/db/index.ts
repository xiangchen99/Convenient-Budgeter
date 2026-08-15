import { getCloudflareContext } from "@opennextjs/cloudflare";

export type D1Result<T = unknown> = {
  results: T[];
  success: boolean;
  meta: Record<string, unknown>;
  error?: string;
};

export type D1ExecResult = {
  count: number;
  duration: number;
};

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

// In-memory SQLite / mock store for local Vitest test runs when D1 binding is not loaded
let localDbOverride: D1Database | null = null;

export function setLocalDbOverride(db: D1Database | null) {
  localDbOverride = db;
}

export async function getDb(): Promise<D1Database> {
  if (localDbOverride) {
    return localDbOverride;
  }

  try {
    const cfContext = await getCloudflareContext({ async: true });
    if (cfContext?.env?.DB) {
      return cfContext.env.DB as D1Database;
    }
  } catch {
    // getCloudflareContext might throw or be undefined outside Cloudflare runtime
  }

  // Fallback check on global process / globalThis if injected
  const globalDb = (globalThis as unknown as { DB?: D1Database }).DB;
  if (globalDb) {
    return globalDb;
  }

  throw new Error(
    "Cloudflare D1 Database binding 'DB' was not found in environment context."
  );
}
