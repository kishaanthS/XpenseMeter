/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Transaction, Category } from '../types';

const STORAGE_KEY = 'xpense_transactions';

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
    localStorage.removeItem(STORAGE_KEY);
    setTransactions([]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const updateTransaction = (id: string, data: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  };

  const getPeriodStats = (startDate: Date, endDate: Date) => {
    const start = startDate.getTime();
    const end = endDate.getTime();
    
    const items = transactions.filter(t => t.timestamp >= start && t.timestamp <= end);
    const expenses = items.filter(t => t.type === Category.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    const income = items.filter(t => t.type === Category.INCOME).reduce((sum, t) => sum + t.amount, 0);

    const dailyData = [];
    const curr = new Date(startDate);
    
    // Check if it's a YEAR period
    const isYear = (endDate.getTime() - startDate.getTime()) > 32 * 24 * 60 * 60 * 1000;
    const isDay = (endDate.getTime() - startDate.getTime()) < 25 * 60 * 60 * 1000;

    if (isYear) {
      // Aggregate by month
      for (let m = 0; m < 12; m++) {
        const monthStart = new Date(startDate.getFullYear(), m, 1).getTime();
        const monthEnd = new Date(startDate.getFullYear(), m + 1, 0, 23, 59, 59, 999).getTime();
        const monthTx = items.filter(t => t.timestamp >= monthStart && t.timestamp <= monthEnd);
        dailyData.push({
          name: format(new Date(startDate.getFullYear(), m, 1), 'MMM'),
          expenses: monthTx.filter(t => t.type === Category.EXPENSE).reduce((sum, t) => sum + t.amount, 0),
          income: monthTx.filter(t => t.type === Category.INCOME).reduce((sum, t) => sum + t.amount, 0)
        });
      }
    } else if (isDay) {
      // Aggregate by 4-hour chunks or just show categories? 
      // Let's show 6 blocks of 4 hours
      for (let h = 0; h < 24; h += 4) {
        const hStart = new Date(startDate).setHours(h, 0, 0, 0);
        const hEnd = new Date(startDate).setHours(h + 3, 59, 59, 999);
        const hTx = items.filter(t => t.timestamp >= hStart && t.timestamp <= hEnd);
        dailyData.push({
          name: `${h}:00`,
          expenses: hTx.filter(t => t.type === Category.EXPENSE).reduce((sum, t) => sum + t.amount, 0),
          income: hTx.filter(t => t.type === Category.INCOME).reduce((sum, t) => sum + t.amount, 0)
        });
      }
    } else {
      // Default: daily (for WEEK and MONTH)
      while (curr <= endDate) {
        const dStart = new Date(curr).setHours(0, 0, 0, 0);
        const dEnd = new Date(curr).setHours(23, 59, 59, 999);
        
        const dayTx = items.filter(t => t.timestamp >= dStart && t.timestamp <= dEnd);
        const dExp = dayTx.filter(t => t.type === Category.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
        const dInc = dayTx.filter(t => t.type === Category.INCOME).reduce((sum, t) => sum + t.amount, 0);
        
        dailyData.push({ 
          name: format(curr, 'dd MMM'), 
          expenses: dExp, 
          income: dInc 
        });
        curr.setDate(curr.getDate() + 1);
      }
    }

    const categoryStats = items
      .filter(t => t.type === Category.EXPENSE)
      .reduce((acc, t) => {
        acc[t.categoryName] = (acc[t.categoryName] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return {
      expenses,
      income,
      balance: income - expenses,
      items,
      dailyData,
      categoryStats: Object.entries(categoryStats).map(([name, value]) => ({ name, value }))
    };
  };

  return {
    transactions,
    addTransaction,
    updateTransaction,
    getPeriodStats,
    clearAll,
    deleteTransaction,
  };
}
