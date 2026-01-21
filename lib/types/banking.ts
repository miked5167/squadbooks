/**
 * Banking Types for Plaid Integration
 *
 * These types define the data structures for bank accounts, transactions,
 * and import flows. For demo purposes, data is stored in session/state.
 */

// Bank Account Types
export interface BankAccount {
  id: string;
  plaidAccountId: string;
  institutionId: string;
  institutionName: string;
  accountName: string;
  accountType: 'checking' | 'savings' | 'credit' | 'investment';
  accountSubtype: string;
  mask: string; // Last 4 digits
  currentBalance: number;
  availableBalance?: number;
  currency: string;
  connectedAt: Date;
  lastSyncedAt: Date | null;
  isActive: boolean;
}

// Plaid Transaction Types
export interface PlaidTransaction {
  id: string;
  plaidTransactionId: string;
  accountId: string;
  amount: number;
  date: string; // ISO date string
  name: string; // Merchant/payee name
  merchantName?: string;
  pending: boolean;
  category?: string[]; // Plaid's category array
  paymentChannel: 'online' | 'in store' | 'other';
  transactionType: 'place' | 'digital' | 'special' | 'unresolved';
  isoCurrencyCode: string;
  // Our categorization
  suggestedCategoryId?: string;
  suggestedCategoryName?: string;
  categoryConfidence?: number; // 0-100
  assignedCategoryId?: string;
  // Import tracking
  isImported: boolean;
  importedAt?: Date;
  isDuplicate?: boolean;
  potentialDuplicateId?: string;
}

// Transaction Import Session
export interface TransactionImportSession {
  bankAccountId: string;
  transactions: PlaidTransaction[];
  selectedTransactionIds: string[];
  categorizedCount: number;
  duplicatesFound: number;
  totalIncome: number;
  totalExpenses: number;
  importedAt?: Date;
}

// Category Suggestion
export interface CategorySuggestion {
  categoryId: string;
  categoryName: string;
  confidence: number; // 0-100
  reason: string;
}

// Bank Connection Metadata (stored in session)
export interface BankConnectionData {
  accessToken: string; // Encrypted
  itemId: string;
  accounts: BankAccount[];
  connectedAt: Date;
  lastSyncedAt: Date | null;
}

// API Response Types
export interface CreateLinkTokenResponse {
  link_token: string;
  expiration: string;
}

export interface ExchangeTokenResponse {
  success: boolean;
  itemId: string;
  accounts: BankAccount[];
}

export interface FetchAccountsResponse {
  success: boolean;
  accounts: BankAccount[];
}

export interface FetchTransactionsResponse {
  success: boolean;
  transactions: PlaidTransaction[];
  totalCount: number;
}

export interface SyncTransactionsResponse {
  success: boolean;
  added: number;
  modified: number;
  removed: number;
  transactions: PlaidTransaction[];
}

// Plaid Link Handler Types
export interface PlaidLinkOnSuccessMetadata {
  institution: {
    institution_id: string;
    name: string;
  };
  account: {
    id: string;
    name: string;
    mask: string;
    type: string;
    subtype: string;
  };
  account_id: string;
  public_token: string;
}

export interface PlaidLinkOnExitMetadata {
  institution?: {
    institution_id: string;
    name: string;
  };
  status?: string;
  link_session_id: string;
  request_id: string;
}

// Transaction Categorization Rule
export interface CategorizationRule {
  pattern: string | RegExp;
  categoryId: string;
  categoryName: string;
  confidence: number;
  description: string;
}

// Import Configuration
export interface ImportConfig {
  startDate: string;
  endDate: string;
  includeP

ending: boolean;
  autoCategorize: boolean;
  skipDuplicates: boolean;
  minConfidence: number; // Minimum confidence for auto-categorization
}

// Bank Connection Status
export type BankConnectionStatus =
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'token_expired'
  | 'syncing';

// Transaction Import Status
export type TransactionImportStatus =
  | 'pending'
  | 'categorizing'
  | 'review'
  | 'importing'
  | 'completed'
  | 'cancelled';
