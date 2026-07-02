import mongoose, { Document, Schema } from 'mongoose';

// Tenant Status
export type TenantStatus = 'inquiry' | 'visited' | 'booked' | 'active' | 'notice' | 'vacated';

// Rent Payment Status
export type PaymentStatus = 'pending' | 'paid' | 'late' | 'defaulted';

// Maintenance Request Status
export type MaintenanceStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

// Tenant Interface
export interface ITenant extends Document {
  ownerId: string;
  propertyId: string;
  // Personal info
  name: string;
  phone: string;
  email?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  // KYC
  aadhar?: string;
  pan?: string;
  photo?: string;
  // Agreement
  leaseStart: Date;
  leaseEnd: Date;
  monthlyRent: number;
  securityDeposit: number;
  maintenanceCharges: number;
  agreementDoc?: string;
  // Status
  status: TenantStatus;
  moveInDate?: Date;
  moveOutDate?: Date;
  noticeGiven?: Date;
  // Financial
  currentBalance: number; // positive = tenant owes, negative = credit
  rentDueDate: number; // day of month
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Rent Payment Interface
export interface IRentPayment extends Document {
  tenantId: string;
  ownerId: string;
  propertyId: string;
  amount: number;
  forMonth: Date;
  dueDate: Date;
  paidDate?: Date;
  status: PaymentStatus;
  paymentMethod?: 'upi' | 'bank_transfer' | 'cash' | 'cheque';
  transactionId?: string;
  lateFee?: number;
  remarks?: string;
  createdAt: Date;
}

// Maintenance Request Interface
export interface IMaintenanceRequest extends Document {
  tenantId: string;
  ownerId: string;
  propertyId: string;
  title: string;
  description: string;
  category: 'plumbing' | 'electrical' | 'carpentry' | 'pest' | 'appliance' | 'other';
  priority: 'low' | 'medium' | 'high' | 'emergency';
  status: MaintenanceStatus;
  assignedTo?: string;
  scheduledDate?: Date;
  completedDate?: Date;
  cost?: number;
  photos?: string[];
  rating?: number;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Document Interface
export interface IPropertyDocument extends Document {
  tenantId: string;
  ownerId: string;
  propertyId: string;
  type: 'aadhar' | 'pan' | 'photo' | 'agreement' | 'police_verification' | 'other';
  documentNumber: string;
  documentUrl: string;
  verified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  expiryDate?: Date;
  createdAt: Date;
}

// Mongoose Schemas
const emergencyContactSchema = new Schema({
  name: String,
  phone: String,
  relation: String
}, { _id: false });

const tenantSchema = new Schema({
  ownerId: { type: String, required: true, index: true },
  propertyId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  emergencyContact: emergencyContactSchema,
  aadhar: String,
  pan: String,
  photo: String,
  leaseStart: { type: Date, required: true },
  leaseEnd: { type: Date, required: true },
  monthlyRent: { type: Number, required: true },
  securityDeposit: { type: Number, required: true },
  maintenanceCharges: { type: Number, default: 0 },
  agreementDoc: String,
  status: { type: String, enum: ['inquiry', 'visited', 'booked', 'active', 'notice', 'vacated'], default: 'inquiry' },
  moveInDate: Date,
  moveOutDate: Date,
  noticeGiven: Date,
  currentBalance: { type: Number, default: 0 },
  rentDueDate: { type: Number, default: 5 }
}, { timestamps: true });

const rentPaymentSchema = new Schema({
  tenantId: { type: String, required: true, index: true },
  ownerId: { type: String, required: true, index: true },
  propertyId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  forMonth: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  paidDate: Date,
  status: { type: String, enum: ['pending', 'paid', 'late', 'defaulted'], default: 'pending' },
  paymentMethod: String,
  transactionId: String,
  lateFee: { type: Number, default: 0 },
  remarks: String
}, { timestamps: true });

const maintenanceRequestSchema = new Schema({
  tenantId: { type: String, required: true, index: true },
  ownerId: { type: String, required: true, index: true },
  propertyId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: String,
  category: { type: String, enum: ['plumbing', 'electrical', 'carpentry', 'pest', 'appliance', 'other'], required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'emergency'], default: 'medium' },
  status: { type: String, enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'], default: 'pending' },
  assignedTo: String,
  scheduledDate: Date,
  completedDate: Date,
  cost: Number,
  photos: [String],
  rating: Number,
  feedback: String
}, { timestamps: true });

const documentSchema = new Schema({
  tenantId: { type: String, required: true, index: true },
  ownerId: { type: String, required: true, index: true },
  propertyId: { type: String, required: true, index: true },
  type: { type: String, enum: ['aadhar', 'pan', 'photo', 'agreement', 'police_verification', 'other'], required: true },
  documentNumber: String,
  documentUrl: { type: String, required: true },
  verified: { type: Boolean, default: false },
  verifiedAt: Date,
  verifiedBy: String,
  expiryDate: Date
}, { timestamps: true });

// Export models
export const Tenant = mongoose.model<ITenant>('Tenant', tenantSchema);
export const RentPayment = mongoose.model<IRentPayment>('RentPayment', rentPaymentSchema);
export const MaintenanceRequest = mongoose.model<IMaintenanceRequest>('MaintenanceRequest', maintenanceRequestSchema);
export const PropertyDocument = mongoose.model<IPropertyDocument>('PropertyDocument', documentSchema);
