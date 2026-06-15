import axios from 'axios';

interface CoinTransaction {
  userId: string;
  amount: number;
  type: 'credit' | 'debit';
  reason: string;
  metadata?: Record<string, unknown>;
}

export class WalletIntegration {
  private walletServiceUrl: string;

  constructor() {
    this.walletServiceUrl = process.env.REZ_WALLET_SERVICE_URL || 'http://localhost:4004';
  }

  async creditCoins(
    userId: string,
    amount: number,
    reason: string,
    metadata?: Record<string, unknown>
  ): Promise<{ success: boolean; balance: number }> {
    try {
      const response = await axios.post(
        `${this.walletServiceUrl}/api/wallet/credit`,
        {
          userId,
          amount,
          reason,
          metadata
        },
        {
          timeout: 5000,
          headers: {
            'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
          }
        }
      );

      return {
        success: true,
        balance: response.data.balance
      };
    } catch (error) {
      console.error('Failed to credit coins:', error);
      return {
        success: false,
        balance: 0
      };
    }
  }

  async debitCoins(
    userId: string,
    amount: number,
    reason: string,
    metadata?: Record<string, unknown>
  ): Promise<{ success: boolean; balance: number }> {
    try {
      const response = await axios.post(
        `${this.walletServiceUrl}/api/wallet/debit`,
        {
          userId,
          amount,
          reason,
          metadata
        },
        {
          timeout: 5000,
          headers: {
            'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
          }
        }
      );

      return {
        success: true,
        balance: response.data.balance
      };
    } catch (error) {
      console.error('Failed to debit coins:', error);
      return {
        success: false,
        balance: 0
      };
    }
  }

  async getBalance(userId: string): Promise<number> {
    try {
      const response = await axios.get(
        `${this.walletServiceUrl}/api/wallet/${userId}/balance`,
        {
          timeout: 3000,
          headers: {
            'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
          }
        }
      );

      return response.data.balance || 0;
    } catch (error) {
      return 0;
    }
  }

  async getTransactionHistory(
    userId: string,
    limit = 20
  ): Promise<CoinTransaction[]> {
    try {
      const response = await axios.get(
        `${this.walletServiceUrl}/api/wallet/${userId}/transactions`,
        {
          params: { limit },
          timeout: 3000,
          headers: {
            'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
          }
        }
      );

      return response.data.transactions || [];
    } catch (error) {
      return [];
    }
  }

  // Coin rewards for Ask Buzz actions
  getRewardAmount(action: string): number {
    const rewards: Record<string, number> = {
      ask_question: 0,
      submit_answer: 15,
      answer_marked_helpful_5: 25,
      answer_verified: 10,
      become_trusted_answerer: 50,
      daily_streak: 5,
      expert_answer: 30
    };

    return rewards[action] || 0;
  }
}
