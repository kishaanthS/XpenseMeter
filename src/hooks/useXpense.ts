/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Transaction, Category } from '../types';

const STORAGE_KEY = 'xpensemeter_transactions';

export function useXpense() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Load from storage on init
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setTransactions(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load transactions', e);
      }
    }
  }, []);

  // Save to storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = (data: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTx: Transaction = {
      ...data,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  const clearAll = () => {
    setTransactions([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const updateTransaction = (id: string, data: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  };

  const getStats = () => {
    const expenses = transactions
      .filter(t => t.type === Category.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const income = transactions
      .filter(t => t.type === Category.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);

    // Group by day for the last 7 days
    const dailyData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayStart = new Date(d.setHours(0, 0, 0, 0)).getTime();
      const dayEnd = new Date(d.setHours(23, 59, 59, 999)).getTime();

      const dayExpenses = transactions
        .filter(t => t.type === Category.EXPENSE && t.timestamp >= dayStart && t.timestamp <= dayEnd)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const dayIncome = transactions
        .filter(t => t.type === Category.INCOME && t.timestamp >= dayStart && t.timestamp <= dayEnd)
        .reduce((sum, t) => sum + t.amount, 0);

      return { name: dateStr, expenses: dayExpenses, income: dayIncome };
    });

    const categoryStats = transactions
      .filter(t => t.type === Category.EXPENSE)
      .reduce((acc, t) => {
        acc[t.categoryName] = (acc[t.categoryName] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return {
      expenses,
      income,
      balance: income - expenses,
      totalTx: transactions.length,
      dailyData,
      categoryStats: Object.entries(categoryStats).map(([name, value]) => ({ name, value }))
    };
  };

  return {
    transactions,
    addTransaction,
    updateTransaction,
    getStats,
    clearAll,
    deleteTransaction,
  };
}
