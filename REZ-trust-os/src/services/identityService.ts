/**
 * REZ Trust OS - Identity Service
 * @module services/identityService
 */

import type { IdentityVerification, IdentityStatus, KycLevel } from '../types.js';

// In-memory store
const identities = new Map<string, IdentityVerification>();

export class IdentityService {
  /**
   * Get identity verification status
   * @param {string} userId - User ID
   * @returns {IdentityVerification | null}
   */
  static getStatus(userId: string): IdentityVerification | null {
    return identities.get(userId) || null;
  }

  /**
   * Submit KYC data
   * @param {string} userId - User ID
   * @param {string[]} documents - Document IDs
   * @returns {IdentityVerification}
   */
  static submitKyc(userId: string, documents: string[]): IdentityVerification {
    const identity: IdentityVerification = {
      userId,
      status: IdentityStatus.IN_REVIEW,
      kycLevel: KycLevel.BASIC,
      documents,
    };

    identities.set(userId, identity);
    return identity;
  }

  /**
   * Verify identity
   * @param {string} userId - User ID
   * @param {KycLevel} level - KYC level
   * @returns {IdentityVerification}
   */
  static verify(userId: string, level: KycLevel): IdentityVerification {
    const current = this.getStatus(userId);
    const identity: IdentityVerification = {
      userId,
      status: IdentityStatus.VERIFIED,
      kycLevel: level,
      verifiedAt: new Date(),
      documents: current?.documents || [],
    };

    identities.set(userId, identity);
    return identity;
  }

  /**
   * Reject identity verification
   * @param {string} userId - User ID
   * @param {string} reason - Rejection reason
   * @returns {IdentityVerification}
   */
  static reject(userId: string, reason: string): IdentityVerification {
    const identity: IdentityVerification = {
      userId,
      status: IdentityStatus.REJECTED,
      kycLevel: KycLevel.NONE,
    };

    identities.set(userId, identity);
    return identity;
  }

  /**
   * Check if user is verified
   * @param {string} userId - User ID
   * @returns {boolean}
   */
  static isVerified(userId: string): boolean {
    const identity = this.getStatus(userId);
    return identity?.status === IdentityStatus.VERIFIED;
  }

  /**
   * Get verification level
   * @param {string} userId - User ID
   * @returns {KycLevel}
   */
  static getLevel(userId: string): KycLevel {
    const identity = this.getStatus(userId);
    return identity?.kycLevel || KycLevel.NONE;
  }
}