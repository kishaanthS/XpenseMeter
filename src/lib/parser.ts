/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Category, Transaction, SMSMessage } from '../types';

// Regex constants as per requirements
const REGEX_AMOUNT = /(rs\.?|inr|₹)\s?(\d+[,\d]*\.?\d*)/i;
const REGEX_TXN_ID = /(ref no|txn id|utr|upi ref)[\s:]*([a-z0-9]+)/i;
const REGEX_SENT = /sent\s+(rs\.?|inr|₹)\s?\d+.*\bto\b/i;
const REGEX_RECEIVED = /received\s+(rs\.?|inr|₹)\s?\d+.*\bfrom\b/i;
const REGEX_DEBITED = /debited|spent|paid/i;
const REGEX_CREDITED = /credited|added|received/i;
const REGEX_ACCOUNT = /(a\/c|acc|account)\s*(no\.|num|ending)?\s*X*(\d{3,4})/i;

// Priority Rules logic
const IGNORE_PATTERNS = [
  /OTP/i,
  /offer/i,
  /discount/i,
  /verification code/i,
  /Total balance/i
];

const SAVINGS_PATTERNS = [
  /EPF/i,
  /interest/i,
  /fixed deposit/i,
  /FD/i
];

const TRANSFER_PATTERNS = [
  /credit card/i,
  /payment/i,
  /self transfer/i
];

export const DEFAULT_CATEGORY_MAP: Record<string, string[]> = {
  'Food': ['swiggy', 'zomato', 'pizza', 'kfc', 'mcdonalds', 'starbucks', 'restaurant', 'cafe', 'dine', 'hotel'],
  'Shopping': ['amazon', 'flipkart', 'myntra', 'mall', 'store', 'retail', 'dmart', 'blinkit', 'zepto'],
  'Travel': ['uber', 'ola', 'irctc', 'indigo', 'petrol', 'fuel', 'shell', 'hpcl', 'rapido', 'train', 'flight'],
  'Entertainment': ['netflix', 'spotify', 'pvr', 'cine', 'bookmyshow', 'hotstar'],
  'Salary': ['salary', 'credited by corp', 'stipend'],
  'Health': ['apollo', 'pharmacy', 'hospital', 'medplus', 'health'],
  'Investment': ['zerodha', 'groww', 'mutual fund', 'sip', 'stock'],
};

function detectCategory(body: string, merchant: string | null, mappings: Record<string, string[]>): string {
  const text = (body + ' ' + (merchant || '')).toLowerCase();
  for (const [cat, keywords] of Object.entries(mappings)) {
    if (keywords.some(kw => text.includes(kw.toLowerCase()))) return cat;
  }
  return 'Personal';
}

/**
 * Robust Regex Parser Engine
 */
export function parseSMS(msg: SMSMessage, mappings: Record<string, string[]> = DEFAULT_CATEGORY_MAP): Transaction | null {
  const body = msg.body;
  let score = 0;
  
  // 1. Initial Ignore Check
  if (IGNORE_PATTERNS.some(p => p.test(body))) {
    return null; 
  }

  // 2. Extract Amount (+3)
  const amountMatch = body.match(REGEX_AMOUNT);
  let amount = 0;
  if (amountMatch) {
    amount = parseFloat(amountMatch[2].replace(/,/g, ''));
    score += 3;
  }

  // 3. Action Signal (+2)
  const isSent = REGEX_SENT.test(body) || REGEX_DEBITED.test(body);
  const isReceived = REGEX_RECEIVED.test(body) || REGEX_CREDITED.test(body);
  if (isSent || isReceived) {
    score += 2;
  }

  // 4. Account/UPI Signal (+2)
  const accountMatch = body.match(REGEX_ACCOUNT);
  const upiMatch = /UPI/i.test(body);
  if (accountMatch || upiMatch) {
    score += 2;
  }

  // 5. Transaction ID (+3)
  const txnIdMatch = body.match(REGEX_TXN_ID);
  let txnId: string | null = null;
  if (txnIdMatch) {
    txnId = txnIdMatch[2];
    score += 3;
  }

  // 6. Date signal (+1) - Assuming the message has a timestamp
  score += 1;

  // Validation Check: score >= 5
  if (score < 5) return null;

  // Classification Logic
  let type = Category.EXPENSE;
  if (SAVINGS_PATTERNS.some(p => p.test(body))) {
    type = Category.SAVINGS;
  } else if (TRANSFER_PATTERNS.some(p => p.test(body)) && /credit card/i.test(body)) {
    type = Category.TRANSFER;
  } else if (isReceived) {
    type = Category.INCOME;
  } else if (isSent) {
    type = Category.EXPENSE;
  }

  // Extract Merchant
  let merchant: string | null = null;
  const merchantMatch = body.match(/(?:to|at|from|by|vpa)\s+([A-Z0-9\s.\-_]{3,30})(?:\s|on|at|ref|$)/i);
  if (merchantMatch) {
    merchant = merchantMatch[1].trim();
  }

  return {
    id: `tx_${msg.sender}_${msg.timestamp}_${amount}`, 
    amount,
    type,
    merchant,
    categoryName: detectCategory(body, merchant, mappings),
    account: accountMatch ? accountMatch[3] : (upiMatch ? 'UPI' : null),
    txnId,
    timestamp: msg.timestamp,
    rawMessage: body,
    confidence: score / 11, 
  };
}

/**
 * Duplicate Detection Logic
 * Unique constraint: txnId OR (amount + timestamp + sender)
 */
export function isDuplicate(newTx: Transaction, existing: Transaction[]): boolean {
  return existing.some(tx => {
    // 1. By Txn ID
    if (newTx.txnId && tx.txnId && newTx.txnId === tx.txnId) {
      return true;
    }
    // 2. By core attributes (Fuzzy duplicate check)
    // Check if same amount, same raw message prefix, and within 1-minute window
    const sameAmount = Math.abs(newTx.amount - tx.amount) < 0.01;
    const sameTime = Math.abs(newTx.timestamp - tx.timestamp) < 60000;
    const sameMsg = newTx.rawMessage.substring(0, 20) === tx.rawMessage.substring(0, 20);
    
    return sameAmount && sameTime && sameMsg;
  });
}
