import mongoose, { Document, Schema } from 'mongoose';

// Trust Score Levels
export type TrustLevel = 'bronze' | 'silver' | 'gold' | 'platinum';

// Rent Credit Status
export type CreditStatus = 'active' | 'suspended' | 'closed';

// Deposit Guarantee Status
export type GuaranteeStatus = 'pending' | 'active' | 'expired' | 'claimed' | 'rejected';

// Rent Credit Interface
export interface IRentCredit extends Document {
  userId: string;
  // Score components
  paymentHistory: number;      // 0-40 points
  tenureScore: number;         // 0-20 points
  incomeVerification: number;    // 0-15 points
  socialScore: number;         // 0-10 points
  societyBehavior: number;       // 0-15 points
  // Total
  totalScore: number;           // 0-100
  trustLevel: TrustLevel;
  // Status
  status: CreditStatus;
  verified: boolean;
  verifiedAt?: Date;
  // Limits
  creditLimit: number;          // Max zero-deposit amount eligible
  eligibleDeposits: number;      // Number of active guarantees
  // Timeline
  firstRentDate?: Date;
  totalDepositsCovered: number;
  createdAt: Date;
  updatedAt: Date;
}

// Deposit Guarantee Interface
export interface IDepositGuarantee extends Document {
  userId: string;
  landlordId: string;
  propertyId: string;
  // Guarantee details
  depositAmount: number;
  guaranteeId: string;          // Unique guarantee code
  // Status
  status: GuaranteeStatus;
  startDate: Date;
  endDate: Date;
  // Claims
  claimReason?: string;
  claimDate?: Date;
  claimApproved?: boolean;
  claimResolvedAt?: Date;
  // Payment to landlord
  paidToLandlord?: Date;
  amountPaid?: number;
  // User pays back
  emiAmount?: number;
  emiTenure?: number;          // months
  emiStartDate?: Date;
  emiPaid?: number;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Payment History Interface
export interface IRentPaymentHistory extends Document {
  userId: string;
  propertyId: string;
  amount: number;
  paidOn: Date;
  onTime: boolean;
  daysLate: number;
  month: Date;
  paymentMethod: string;
  transactionId?: string;
  // For credit calculation
  streak: number;               // Consecutive on-time payments
  createdAt: Date;
}

// Guarantee Application Interface
export interface IGuaranteeApplication extends Document {
  userId: string;
  propertyId: string;
  landlordId: string;
  depositAmount: number;
  monthlyRent: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  rejectionReason?: string;
  approvedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
}

// Mongoose Schemas
const rentCreditSchema = new Schema({
  userId: { type: String, required: true, unique: true, index: true },
  paymentHistory: { type: Number, default: 0, min: 0, max: 40 },
  tenureScore: { type: Number, default: 0, min: 0, max: 20 },
  incomeVerification: { type: Number, default: 0, min: 0, max: 15 },
  socialScore: { type: Number, default: 0, min: 0, max: 10 },
  societyBehavior: { type: Number, default: 0, min: 0, max: 15 },
  totalScore: { type: Number, default: 0, min: 0, max: 100 },
  trustLevel: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
  status: { type: String, enum: ['active', 'suspended', 'closed'], default: 'active' },
  verified: { type: Boolean, default: false },
  verifiedAt: Date,
  creditLimit: { type: Number, default: 0 },
  eligibleDeposits: { type: Number, default: 0 },
  firstRentDate: Date,
  totalDepositsCovered: { type: Number, default: 0 }
}, { timestamps: true });

const depositGuaranteeSchema = new Schema({
  userId: { type: String, required: true, index: true },
  landlordId: { type: String, required: true, index: true },
  propertyId: { type: String, required: true, index: true },
  depositAmount: { type: Number, required: true },
  guaranteeId: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'active', 'expired', 'claimed', 'rejected'], default: 'pending' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  claimReason: String,
  claimDate: Date,
  claimApproved: Boolean,
  claimResolvedAt: Date,
  paidToLandlord: Date,
  amountPaid: Number,
  emiAmount: Number,
  emiTenure: Number,
  emiStartDate: Date,
  emiPaid: { type: Number, default: 0 }
}, { timestamps: true });

const paymentHistorySchema = new Schema({
  userId: { type: String, required: true, index: true },
  propertyId: { type: String, required: true },
  amount: { type: Number, required: true },
  paidOn: { type: Date, required: true },
  onTime: { type: Boolean, required: true },
  daysLate: { type: Number, default: 0 },
  month: { type: Date, required: true },
  paymentMethod: String,
  transactionId: String,
  streak: { type: Number, default: 1 }
}, { timestamps: true });

const guaranteeApplicationSchema = new Schema({
  userId: { type: String, required: true, index: true },
  propertyId: { type: String, required: true },
  landlordId: { type: String, required: true },
  depositAmount: { type: Number, required: true },
  monthlyRent: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'expired'], default: 'pending' },
  rejectionReason: String,
  approvedAt: Date,
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

// Export models
export const RentCredit = mongoose.model<IRentCredit>('RentCredit', rentCreditSchema);
export const DepositGuarantee = mongoose.model<IDepositGuarantee>('DepositGuarantee', depositGuaranteeSchema);
export const RentPaymentHistory = mongoose.model<IRentPaymentHistory>('RentPaymentHistory', paymentHistorySchema);
export const GuaranteeApplication = mongoose.model<IGuaranteeApplication>('GuaranteeApplication', guaranteeApplicationSchema);
