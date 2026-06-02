/**
 * Axomi Help + Verify QR Integration
 * Product verification, warranty, claims, and service booking
 */

import axios from 'axios';
import { pino } from '../logger.js';

const logger = pino.child({ module: 'VerifyQRIntegration' });

const VERIFY_QR_URL = process.env.VERIFY_QR_URL || 'http://localhost:4003';

export interface ProductInfo {
  status: 'AUTHENTIC' | 'INVALID' | 'FLAGGED';
  serial_number: string;
  brand: string;
  model: string;
  category?: string;
  verification_count: number;
  warranty_status?: 'active' | 'pending' | 'expired' | 'claimed' | 'NOT_ACTIVATED';
  ownership_status?: string;
}

export interface WarrantyInfo {
  warranty_id: string;
  serial_number: string;
  warranty_status: 'pending' | 'active' | 'expired' | 'claimed';
  warranty_start_date: Date;
  warranty_expiry_date: Date;
  remaining_days: number;
  plan_type?: string;
}

export interface ClaimInfo {
  claim_id: string;
  serial_number: string;
  status: string;
  issue_type: string;
  issue_description: string;
  service_center_name?: string;
  resolution_type?: string;
  created_at: Date;
}

export interface ServiceCenter {
  center_id: string;
  name: string;
  city: string;
  address: string;
  services: string[];
  brands: string[];
  phone?: string;
}

export interface ServiceBooking {
  booking_id: string;
  serial_number: string;
  service_center_name: string;
  scheduled_date: string;
  scheduled_time: string;
  service_type: string;
  status: string;
  estimated_cost?: number;
  warranty_covered: boolean;
}

export interface OwnershipPassport {
  passport_id: string;
  serial_number: string;
  brand: string;
  model: string;
  current_owner: {
    name: string;
    phone: string;
    owned_since: Date;
  };
  warranty: {
    status: string;
    remaining_days: number;
    plan_type?: string;
  };
  service_history_count: number;
  status: string;
}

export class VerifyQRIntegration {
  // Verify product authenticity
  async verifyProduct(serialNumber: string, userId?: string, location?: { lat: number; lng: number }): Promise<ProductInfo> {
    try {
      const response = await axios.post(`${VERIFY_QR_URL}/api/verify`, {
        serial_number: serialNumber,
        user_id: userId,
        location
      });

      logger.info({ serialNumber, status: response.data.status }, 'Product verified');

      return response.data;
    } catch (error) {
      logger.error({ error, serialNumber }, 'Failed to verify product');
      throw new Error('Product verification failed');
    }
  }

  // Get warranty information
  async getWarranty(serialNumber: string, userId?: string): Promise<WarrantyInfo | null> {
    try {
      const response = await axios.get(`${VERIFY_QR_URL}/api/warranty/lookup`, {
        params: { serial_number: serialNumber, user_id: userId }
      });

      return response.data;
    } catch (error) {
      logger.warn({ error, serialNumber }, 'No warranty found');
      return null;
    }
  }

  // Check warranty status and provide guidance
  async checkWarrantyStatus(serialNumber: string, userId?: string): Promise<{
    hasWarranty: boolean;
    isActive: boolean;
    daysRemaining: number;
    message: string;
    suggestions: string[];
  }> {
    const warranty = await this.getWarranty(serialNumber, userId);

    if (!warranty) {
      return {
        hasWarranty: false,
        isActive: false,
        daysRemaining: 0,
        message: 'No warranty found for this product.',
        suggestions: ['Activate warranty', 'Buy extended warranty', 'Contact manufacturer']
      };
    }

    const remainingDays = Math.ceil(
      (new Date(warranty.warranty_expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (warranty.warranty_status === 'active') {
      return {
        hasWarranty: true,
        isActive: true,
        daysRemaining: remainingDays,
        message: `Your warranty is active for ${remainingDays} more days.`,
        suggestions: ['File warranty claim', 'Book service', 'View service history', 'Check extended warranty options']
      };
    } else if (warranty.warranty_status === 'expired') {
      return {
        hasWarranty: true,
        isActive: false,
        daysRemaining: 0,
        message: `Your warranty expired ${Math.abs(remainingDays)} days ago.`,
        suggestions: ['Buy extended warranty', 'File paid service request', 'View service centers']
      };
    } else if (warranty.warranty_status === 'claimed') {
      return {
        hasWarranty: true,
        isActive: false,
        daysRemaining: remainingDays,
        message: 'A warranty claim is already in progress.',
        suggestions: ['Check claim status', 'Contact support']
      };
    }

    return {
      hasWarranty: true,
      isActive: warranty.warranty_status === 'active',
      daysRemaining: remainingDays,
      message: `Warranty status: ${warranty.warranty_status}`,
      suggestions: ['Contact support']
    };
  }

  // File warranty claim
  async fileClaim(data: {
    serialNumber: string;
    userId: string;
    userName: string;
    userPhone: string;
    issueType: string;
    issueDescription: string;
    photos?: string[];
  }): Promise<ClaimInfo> {
    try {
      const response = await axios.post(`${VERIFY_QR_URL}/api/claim`, {
        serial_number: data.serialNumber,
        user_id: data.userId,
        customer_name: data.userName,
        customer_phone: data.userPhone,
        issue_type: data.issueType,
        issue_description: data.issueDescription,
        photos: data.photos
      });

      logger.info({ claimId: response.data.claim_id }, 'Warranty claim filed');

      return response.data;
    } catch (error) {
      logger.error({ error, serialNumber: data.serialNumber }, 'Failed to file claim');
      throw new Error('Failed to file warranty claim');
    }
  }

  // Get claim status
  async getClaimStatus(claimId: string): Promise<ClaimInfo | null> {
    try {
      const response = await axios.get(`${VERIFY_QR_URL}/api/claim/${claimId}`);
      return response.data;
    } catch (error) {
      logger.warn({ error, claimId }, 'Claim not found');
      return null;
    }
  }

  // Get service centers
  async getServiceCenters(brand?: string, city?: string): Promise<ServiceCenter[]> {
    try {
      const params: Record<string, string> = {};
      if (brand) params.brand = brand;
      if (city) params.city = city;

      const response = await axios.get(`${VERIFY_QR_URL}/api/service-centers`, { params });
      return response.data;
    } catch (error) {
      logger.error({ error }, 'Failed to get service centers');
      return [];
    }
  }

  // Book service appointment
  async bookService(data: {
    serialNumber: string;
    userId: string;
    userName: string;
    userPhone: string;
    centerId: string;
    centerName: string;
    preferredDate: string;
    preferredTime: string;
    serviceType: string;
    issueDescription?: string;
  }): Promise<ServiceBooking> {
    try {
      const response = await axios.post(`${VERIFY_QR_URL}/api/service/book`, {
        serial_number: data.serialNumber,
        user_id: data.userId,
        customer_name: data.userName,
        customer_phone: data.userPhone,
        service_center_id: data.centerId,
        service_center_name: data.centerName,
        preferred_date: data.preferredDate,
        preferred_time: data.preferredTime,
        service_type: data.serviceType,
        issue_description: data.issueDescription
      });

      logger.info({ bookingId: response.data.booking_id }, 'Service booked');

      return response.data;
    } catch (error) {
      logger.error({ error, serialNumber: data.serialNumber }, 'Failed to book service');
      throw new Error('Failed to book service appointment');
    }
  }

  // Get service booking status
  async getBookingStatus(bookingId: string): Promise<ServiceBooking | null> {
    try {
      const response = await axios.get(`${VERIFY_QR_URL}/api/service/booking/${bookingId}`);
      return response.data;
    } catch (error) {
      logger.warn({ error, bookingId }, 'Booking not found');
      return null;
    }
  }

  // Get ownership passport
  async getOwnershipPassport(serialNumber: string): Promise<OwnershipPassport | null> {
    try {
      const response = await axios.get(`${VERIFY_QR_URL}/api/passport/${serialNumber}`);
      return response.data;
    } catch (error) {
      logger.warn({ error, serialNumber }, 'Passport not found');
      return null;
    }
  }

  // Get available warranty plans
  async getWarrantyPlans(): Promise<{
    plan_id: string;
    name: string;
    duration_months: number;
    price: number;
    coverage: string[];
  }[]> {
    try {
      const response = await axios.get(`${VERIFY_QR_URL}/api/warranty-plans`);
      return response.data;
    } catch (error) {
      logger.error({ error }, 'Failed to get warranty plans');
      return [];
    }
  }

  // Process Axomi Concierge intent for Verify QR
  async processVerifyQRIntent(
    message: string,
    context: { serialNumber?: string; userId?: string; brand?: string }
  ): Promise<{
    intent: 'verify' | 'warranty_status' | 'file_claim' | 'book_service' | 'service_centers' | 'ownership_passport' | 'warranty_plans';
    data?: unknown;
    message: string;
    suggestions: string[];
  }> {
    const lowerMessage = message.toLowerCase();

    // Verify product
    if (lowerMessage.includes('verify') || lowerMessage.includes('authentic') || lowerMessage.includes('genuine')) {
      if (context.serialNumber) {
        const product = await this.verifyProduct(context.serialNumber, context.userId);
        return {
          intent: 'verify',
          data: product,
          message: product.status === 'AUTHENTIC'
            ? `✅ Product verified: ${product.brand} ${product.model}. Warranty: ${product.warranty_status || 'Not activated'}`
            : `❌ Product verification failed: ${product.status}`,
          suggestions: ['Check warranty status', 'File claim', 'Book service']
        };
      }
      return {
        intent: 'verify',
        message: 'To verify your product, please provide the serial number or QR code.',
        suggestions: ['Share serial number', 'Scan QR code']
      };
    }

    // Warranty status
    if (lowerMessage.includes('warranty') || lowerMessage.includes('coverage')) {
      if (context.serialNumber) {
        const status = await this.checkWarrantyStatus(context.serialNumber, context.userId);
        return {
          intent: 'warranty_status',
          data: status,
          message: status.message,
          suggestions: status.suggestions
        };
      }
      return {
        intent: 'warranty_status',
        message: 'To check warranty status, please provide your serial number.',
        suggestions: ['Share serial number']
      };
    }

    // File claim
    if (lowerMessage.includes('claim') || lowerMessage.includes('complaint') || lowerMessage.includes('issue')) {
      if (context.serialNumber) {
        const warranty = await this.checkWarrantyStatus(context.serialNumber, context.userId);
        if (!warranty.isActive) {
          return {
            intent: 'file_claim',
            message: 'Your warranty is not active. Would you like to:',
            suggestions: ['Buy extended warranty', 'File paid service request', 'Contact support']
          };
        }
        return {
          intent: 'file_claim',
          message: 'I can help you file a warranty claim. What is the issue with your product?',
          suggestions: ['Not cooling', 'Not working', 'Physical damage', 'Other issue']
        };
      }
      return {
        intent: 'file_claim',
        message: 'To file a warranty claim, please provide your serial number.',
        suggestions: ['Share serial number']
      };
    }

    // Book service
    if (lowerMessage.includes('service') || lowerMessage.includes('repair') || lowerMessage.includes('book')) {
      if (context.brand) {
        const centers = await this.getServiceCenters(context.brand);
        if (centers.length > 0) {
          return {
            intent: 'service_centers',
            data: centers.slice(0, 3),
            message: `Found ${centers.length} service centers for ${context.brand}.`,
            suggestions: ['Book appointment', 'View all centers']
          };
        }
      }
      return {
        intent: 'service_centers',
        message: 'I can help you find a service center. Please provide your city and brand.',
        suggestions: ['Share your location', 'Provide brand name']
      };
    }

    // Ownership passport
    if (lowerMessage.includes('passport') || lowerMessage.includes('history') || lowerMessage.includes('ownership')) {
      if (context.serialNumber) {
        const passport = await this.getOwnershipPassport(context.serialNumber);
        if (passport) {
          return {
            intent: 'ownership_passport',
            data: passport,
            message: `Ownership Passport: ${passport.brand} ${passport.model}. Owner: ${passport.current_owner.name}. Service history: ${passport.service_history_count} records.`,
            suggestions: ['View full history', 'Transfer ownership', 'File service request']
          };
        }
      }
      return {
        intent: 'ownership_passport',
        message: 'To view ownership passport, please provide your serial number.',
        suggestions: ['Share serial number']
      };
    }

    // Extended warranty
    if (lowerMessage.includes('extended') || lowerMessage.includes('renew')) {
      const plans = await this.getWarrantyPlans();
      return {
        intent: 'warranty_plans',
        data: plans,
        message: plans.length > 0
          ? `Available extended warranty plans: ${plans.map(p => `${p.name} (₹${p.price})`).join(', ')}`
          : 'No extended warranty plans available.',
        suggestions: ['Buy basic plan', 'Buy premium plan', 'Learn more']
      };
    }

    return {
      intent: 'verify',
      message: 'I can help you with product verification, warranty status, claims, and service booking.',
      suggestions: ['Verify product', 'Check warranty', 'File claim', 'Book service']
    };
  }
}

export const verifyQRIntegration = new VerifyQRIntegration();
