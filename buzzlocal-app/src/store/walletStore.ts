import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction } from '@/types';

interface WalletState {
  balance: number;
  transactions: Transaction[];
  isLoading: boolean;
  hasMore: boolean;
  page: number;

  // Actions
  setBalance: (balance: number) => void;
  addTransaction: (transaction: Transaction) => void;
  setTransactions: (transactions: Transaction[]) => void;
  appendTransactions: (transactions: Transaction[]) => void;
  setLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setPage: (page: number) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      balance: 0,
      transactions: [],
      isLoading: false,
      hasMore: true,
      page: 1,

      setBalance: (balance) => set({ balance }),

      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [transaction, ...state.transactions],
          balance:
            transaction.type === 'earn'
              ? state.balance + transaction.amount
              : state.balance - transaction.amount,
        })),

      setTransactions: (transactions) => set({ transactions }),

      appendTransactions: (transactions) =>
        set((state) => ({
          transactions: [...state.transactions, ...transactions],
        })),

      setLoading: (isLoading) => set({ isLoading }),

      setHasMore: (hasMore) => set({ hasMore }),

      setPage: (page) => set({ page }),
    }),
    {
      name: 'buzzlocal-wallet-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        balance: state.balance,
        transactions: state.transactions.slice(0, 50), // Keep last 50 for quick load
        page: state.page,
      }),
    }
  )
);
