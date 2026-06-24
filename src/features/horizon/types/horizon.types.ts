export type TransactionStatus = 'pending' | 'completed' | 'failed';

export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  logo: string;
  category: string;
  account: string;
  status: TransactionStatus;
  amount: number;
  notes: string;
  receipt: string | null; // Base64 data URL or null
}

export type HorizonViewMode = 'dashboard' | 'analytics' | 'transactions' | 'settings';

export interface HorizonStats {
  outflow: number;
  inflow: number;
  pending: number;
}
