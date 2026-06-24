import type { Transaction } from '../types/horizon.types';

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "TXN-849032",
    date: "Jun 8, 2026, 2:32 PM",
    merchant: "Amazon.com (International Services LLC, US Retail Operations Branch)",
    logo: "A",
    category: "Shopping",
    account: "Amex Gold ...2003",
    status: "pending",
    amount: -142.50,
    notes: "Office supplies and mechanical keyboard.",
    receipt: null
  },
  {
    id: "TXN-329841",
    date: "Jun 7, 2026, 9:15 AM",
    merchant: "Starbucks Coffee",
    logo: "S",
    category: "Dining",
    account: "Chase Checking ...4392",
    status: "completed",
    amount: -6.75,
    notes: "Morning flat white espresso.",
    receipt: null
  },
  {
    id: "TXN-902341",
    date: "Jun 5, 2026, 8:00 AM",
    merchant: "Acme Employer Corp",
    logo: "AE",
    category: "Income",
    account: "Chase Checking ...4392",
    status: "completed",
    amount: 3450.00,
    notes: "Bi-weekly paycheck salary credit.",
    receipt: null
  },
  {
    id: "TXN-104928",
    date: "Jun 4, 2026, 12:45 PM",
    merchant: "Costco Wholesale Corporation",
    logo: "C",
    category: "Groceries",
    account: "Chase Checking ...4392",
    status: "completed",
    amount: -289.40,
    notes: "Monthly bulk grocery run.",
    receipt: null
  },
  {
    id: "TXN-490321",
    date: "Jun 3, 2026, 3:30 PM",
    merchant: "Netflix Subscription",
    logo: "N",
    category: "Subscriptions",
    account: "Amex Gold ...2003",
    status: "completed",
    amount: -15.49,
    notes: "Premium UHD subscription plan.",
    receipt: null
  },
  {
    id: "TXN-901842",
    date: "Jun 1, 2026, 9:00 AM",
    merchant: "Springfield Properties Inc.",
    logo: "SP",
    category: "Rent / Housing",
    account: "Chase Checking ...4392",
    status: "completed",
    amount: -2100.00,
    notes: "Apartment 3B rent payment.",
    receipt: null
  },
  {
    id: "TXN-301928",
    date: "May 30, 2026, 11:20 AM",
    merchant: "Chevron Gas Station #8932",
    logo: "C",
    category: "Auto & Transport",
    account: "Amex Gold ...2003",
    status: "completed",
    amount: -45.30,
    notes: "Full tank refill.",
    receipt: null
  },
  {
    id: "TXN-283921",
    date: "May 28, 2026, 8:15 PM",
    merchant: "Olive Garden Restaurant",
    logo: "OG",
    category: "Dining",
    account: "Chase Checking ...4392",
    status: "completed",
    amount: -84.20,
    notes: "Dinner with team colleagues.",
    receipt: null
  },
  {
    id: "TXN-271039",
    date: "May 27, 2026, 4:40 PM",
    merchant: "Target Stores (Springfield Mall East)",
    logo: "T",
    category: "Shopping",
    account: "Amex Gold ...2003",
    status: "completed",
    amount: -32.10,
    notes: "Household goods and laundry detergent.",
    receipt: null
  },
  {
    id: "TXN-250391",
    date: "May 25, 2026, 8:00 AM",
    merchant: "Vanguard Dividend Fund Payout",
    logo: "V",
    category: "Investments",
    account: "Vanguard ...8829",
    status: "completed",
    amount: 125.60,
    notes: "Quarterly index fund dividend payout.",
    receipt: null
  }
];
