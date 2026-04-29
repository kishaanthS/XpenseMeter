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
  id: string; 
  amount: number;
  type: Category;
  categoryName: string; 
  bank: string;
  notes: string;
  timestamp: number;
}

export interface SMSMessage {
  id: string;
  sender: string;
  body: string;
  timestamp: number;
}
