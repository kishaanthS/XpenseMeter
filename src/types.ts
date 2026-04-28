/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Category {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME',
  TRANSFER = 'TRANSFER',
  SAVINGS = 'SAVINGS',
  IGNORE = 'IGNORE'
}

export interface Transaction {
  id: string; // Internal unique ID (can be hash or UUID)
  amount: number;
  type: Category;
  merchant: string | null;
  categoryName?: string; // e.g. Food, Shopping, Travel
  account: string | null;
  txnId: string | null;
  timestamp: number;
  rawMessage: string;
  confidence: number;
  isAiProcessed?: boolean;
}

export interface SMSMessage {
  id: string;
  sender: string;
  body: string;
  timestamp: number;
}
