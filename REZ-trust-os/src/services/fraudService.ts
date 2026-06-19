/**
 * REZ Trust OS - Fraud Detection Service
 * @module services/fraudService
 */

import type { FraudCheck } from '../types.js';
import { FraudRisk, FraudFlag } from '../types.js';

// In-memory store
const fraudChecks = new Map<string, FraudCheck[]>();

export class FraudService {
  /**
   * Check for fraud indicators
   * @param {string} userId - User ID
   * @param {Record<string, unknown>} metadata - Check metadata
   * @returns {FraudCheck}
   */
  static check(userId: string, metadata: Record<string, unknown> = {}): FraudCheck {
    const flags: FraudFlag[] = [];
    let risk: FraudRisk = FraudRisk.LOW;

    // Check for unusual location
    if (metadata.location && this.isUnusualLocation(metadata.location as string)) {
      flags.push(FraudFlag.UNUSUAL_LOCATION);
    }

    // Check for rapid activity
    if (this.hasRapidActivity(userId)) {
      flags.push(FraudFlag.RAPID_ACTIVITY);
    }

    // Check for pattern anomaly
    if (this.hasPatternAnomaly(userId)) {
      flags.push(FraudFlag.PATTERN_ANOMALY);
    }

    // Check for suspicious device
    if (metadata.deviceId && this.isSuspiciousDevice(metadata.deviceId as string)) {
      flags.push(FraudFlag.SUSPICIOUS_DEVICE);
    }

    // Check velocity
    if (this.hasVelocityIssue(userId)) {
      flags.push(FraudFlag.VELOCITY_CHECK);
    }

    // Determine risk level
    if (flags.length >= 3) {
      risk = FraudRisk.CRITICAL;
    } else if (flags.length >= 2) {
      risk = FraudRisk.HIGH;
    } else if (flags.length >= 1) {
      risk = FraudRisk.MEDIUM;
    }

    const fraudCheck: FraudCheck = {
      userId,
      risk,
      flags,
      checkedAt: new Date(),
    };

    // Store check
    const checks = fraudChecks.get(userId) || [];
    checks.push(fraudCheck);
    fraudChecks.set(userId, checks.slice(-100));

    return fraudCheck;
  }

  /**
   * Get fraud history for a user
   * @param {string} userId - User ID
   * @returns {FraudCheck[]}
   */
  static getHistory(userId: string): FraudCheck[] {
    return fraudChecks.get(userId) || [];
  }

  /**
   * Check if location is unusual
   * @param {string} location - Location
   * @returns {boolean}
   */
  private static isUnusualLocation(location: string): boolean {
    // Simplified check - in production, compare with user's normal locations
    return location.includes('unknown') || location.includes('VPN');
  }

  /**
   * Check for rapid activity
   * @param {string} userId - User ID
   * @returns {boolean}
   */
  private static hasRapidActivity(userId: string): boolean {
    const checks = fraudChecks.get(userId) || [];
    const recentChecks = checks.filter(
      (c) => Date.now() - c.checkedAt.getTime() < 60000
    );
    return recentChecks.length > 10;
  }

  /**
   * Check for pattern anomaly
   * @param {string} userId - User ID
   * @returns {boolean}
   */
  private static hasPatternAnomaly(userId: string): boolean {
    const checks = fraudChecks.get(userId) || [];
    const recentChecks = checks.filter(
      (c) => Date.now() - c.checkedAt.getTime() < 300000
    );
    return recentChecks.some((c) => c.risk === FraudRisk.HIGH);
  }

  /**
   * Check if device is suspicious
   * @param {string} deviceId - Device ID
   * @returns {boolean}
   */
  private static isSuspiciousDevice(deviceId: string): boolean {
    // Simplified check - in production, maintain device blacklist
    return deviceId.startsWith('emulator') || deviceId.includes('bot');
  }

  /**
   * Check for velocity issues
   * @param {string} userId - User ID
   * @returns {boolean}
   */
  private static hasVelocityIssue(userId: string): boolean {
    const checks = fraudChecks.get(userId) || [];
    const recentChecks = checks.filter(
      (c) => Date.now() - c.checkedAt.getTime() < 60000
    );
    return recentChecks.length > 5;
  }
}