/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { Transaction, SMSMessage, Category } from '../types';
import { parseSMS, isDuplicate } from '../lib/parser';
import { GoogleGenAI, Type } from "@google/genai";

const STORAGE_KEY = 'xpensemeter_transactions';

export function useXpense() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

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

  const addTransactions = useCallback((newMsgs: SMSMessage[], sinceTimestamp: number = 0) => {
    setIsSyncing(true);
    
    // Simulate network delay
    setTimeout(() => {
      const processed: Transaction[] = [];
      
      // Filter by date first
      const filteredMsgs = newMsgs.filter(m => m.timestamp >= sinceTimestamp);

      filteredMsgs.forEach(msg => {
        const tx = parseSMS(msg);
        if (tx && !isDuplicate(tx, [...transactions, ...processed])) {
          processed.push(tx);
        }
      });

      setTransactions(prev => [...processed, ...prev].sort((a, b) => b.timestamp - a.timestamp));
      setIsSyncing(false);
    }, 1500);
  }, [transactions]);

  const clearAll = () => {
    setTransactions([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const getStats = () => {
    const expenses = transactions
      .filter(t => t.type === Category.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const income = transactions
      .filter(t => t.type === Category.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);

    const savings = transactions
      .filter(t => t.type === Category.SAVINGS)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      expenses,
      income,
      savings,
      balance: income - expenses,
      totalTx: transactions.length
    };
  };

  /**
   * AI Refinement for low confidence transactions
   */
  const refineWithAi = async (tx: Transaction) => {
    if (!process.env.GEMINI_API_KEY) return tx;
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Analyze this SMS message and extract financial details in JSON format.
      Message: "${tx.rawMessage}"
      
      Requirements:
      - amount (number)
      - category (EXPENSE, INCOME, TRANSFER, SAVINGS, IGNORE)
      - merchant (string or null)
      - account (string or null)
      - txnId (string or null)`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              amount: { type: Type.NUMBER },
              category: { type: Type.STRING },
              merchant: { type: Type.STRING },
              account: { type: Type.STRING },
              txnId: { type: Type.STRING }
            }
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      
      const refinedTx = {
        ...tx,
        amount: result.amount || tx.amount,
        type: (result.category as Category) || tx.type,
        merchant: result.merchant || tx.merchant,
        account: result.account || tx.account,
        txnId: result.txnId || tx.txnId,
        isAiProcessed: true,
        confidence: 1.0
      };

      setTransactions(prev => prev.map(t => t.id === tx.id ? refinedTx : t));
      return refinedTx;
    } catch (e) {
      console.error('AI Refinement failed', e);
      return tx;
    }
  };

  return {
    transactions,
    addTransactions,
    getStats,
    isSyncing,
    clearAll,
    deleteTransaction,
    refineWithAi
  };
}
