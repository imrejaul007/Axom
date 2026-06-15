/**
 * Scam Detection Service
 * Detects phishing, scam calls, SMS fraud, and malicious links
 */

import type {
  ScamCheckRequest,
  ScamCheckResult,
  ScamType,
  RiskLevel,
} from '../types/index.js';

// ============================================
// SCAM PATTERNS
// ============================================

const SCAM_PATTERNS = {
  // Urgency keywords
  urgency: [
    'immediately', 'urgent', 'act now', 'expires today', 'within 24 hours',
    'hurry', 'limited time', 'last chance', 'final notice', 'don\'t miss',
    'deadline', 'suspended', 'blocked', 'locked', 'will be closed'
  ],

  // Fear keywords
  fear: [
    'account will be blocked', 'kyc expired', 'verify immediately',
    'your account has been', 'unauthorized access', 'security alert',
    'unusual activity', 'suspicious transaction', 'frozen', 'legal action',
    'court', 'arrest warrant', 'cibil', 'blacklist'
  ],

  // Money keywords
  money: [
    'win', 'prize', 'lottery', 'congratulations', 'reward', 'gift',
    'cashback', 'refund', 'money transfer', 'payment received',
    '₹', 'rs ', 'rupees', 'k donation', 'inheritance'
  ],

  // Personal info requests
  personalInfo: [
    'otp', 'one time password', 'cvv', 'card number', 'account number',
    'password', 'pin', 'aadhaar', 'pan card', 'verify your',
    'update your', 'confirm your', 'share your'
  ],

  // Fake bank patterns
  fakeBank: [
    'sbi-secure', 'hdfc-update', 'icici-verify', 'axisbank',
    'yesbank', 'kotak', 'pnb', 'bank of baroda',
    'mobile banking', 'internet banking', 'net banking'
  ],

  // UPI/Govt patterns
  upiGovt: [
    'upi', 'google pay', 'phonepe', 'paytm', 'gov.in', 'govt',
    'income tax', 'gst', 'pan', 'aadhaar', 'ssup', 'mparcel'
  ],

  // Job scams
  jobScam: [
    'work from home', 'data entry job', ' Typing job', 'Salary: ₹',
    'no experience needed', 'earn daily', 'part time job',
    'freelance', 'home based work', 'package', 'interview call'
  ],

  // Investment scams
  investmentScam: [
    'double your money', 'guaranteed returns', 'bitcoin', 'cryptocurrency',
    'stock tips', 'trading platform', 'investment plan', 'mutual fund',
    'fixed deposit', 'fd rates', 'loan approval'
  ]
};

// Suspicious TLDs (Top Level Domains)
const SUSPICIOUS_TLDS = [
  '.xyz', '.top', '.click', '.link', '.work', '.loan', '.online',
  '.site', '.website', '.space', '.pw', '.tk', '.ml', '.ga', '.cf', '.gq'
];

// Fake bank domains (common patterns)
const FAKE_BANK_DOMAINS = [
  'sbi-secure', 'sbi-update', 'hdfc-login', 'icici-secure',
  'axisbank', 'yesbank-login', 'bankofbaroda', 'pnbservices'
];

export class ScamDetectionService {
  /**
   * Check content for scam indicators
   */
  check(request: ScamCheckRequest): ScamCheckResult {
    const startTime = Date.now();

    let isScam = false;
    const reasons: string[] = [];
    const warnings: string[] = [];
    let scamType: ScamType | undefined;
    let riskScore = 0;

    const content = request.content.toLowerCase();

    // Check based on type
    switch (request.type) {
      case 'sms':
      case 'whatsapp':
        ({ isScam, reasons, warnings, scamType, riskScore } = this.checkMessage(content, request));
        break;

      case 'link':
        if (request.url) {
          ({ isScam, reasons, warnings, scamType, riskScore } = this.checkUrl(request.url, request));
        }
        break;

      case 'call':
        // Call detection would require more complex voice analysis
        // For now, check if phone number is suspicious
        ({ isScam, reasons, warnings, scamType, riskScore } = this.checkCaller(request));
        break;
    }

    return {
      isScam,
      confidence: riskScore >= 70 ? 0.9 : riskScore >= 50 ? 0.7 : 0.5,
      scamType,
      riskScore,
      reasons,
      warnings,
      recommendations: this.getRecommendations(riskScore, scamType),
    };
  }

  /**
   * Check message for scam patterns
   */
  private checkMessage(
    content: string,
    request: ScamCheckRequest
  ): {
    isScam: boolean;
    reasons: string[];
    warnings: string[];
    scamType?: ScamType;
    riskScore: number;
  } {
    const reasons: string[] = [];
    const warnings: string[] = [];
    let riskScore = 0;
    let scamType: ScamType | undefined;

    // Check urgency
    for (const pattern of SCAM_PATTERNS.urgency) {
      if (content.includes(pattern)) {
        reasons.push(`Urgency manipulation: "${pattern}"`);
        riskScore += 15;
        break;
      }
    }

    // Check fear
    for (const pattern of SCAM_PATTERNS.fear) {
      if (content.includes(pattern)) {
        reasons.push(`Fear tactic: "${pattern}"`);
        riskScore += 20;
        break;
      }
    }

    // Check money/offer
    for (const pattern of SCAM_PATTERNS.money) {
      if (content.includes(pattern)) {
        warnings.push(`Money/offer: "${pattern}"`);
        riskScore += 10;
        break;
      }
    }

    // Check personal info requests (CRITICAL)
    for (const pattern of SCAM_PATTERNS.personalInfo) {
      if (content.includes(pattern)) {
        reasons.push(`Personal info request: "${pattern}"`);
        riskScore += 25;
        break;
      }
    }

    // Check fake bank impersonation
    for (const pattern of SCAM_PATTERNS.fakeBank) {
      if (content.includes(pattern)) {
        reasons.push(`Bank impersonation detected: "${pattern}"`);
        riskScore += 25;
        scamType = 'bank_scam';
        break;
      }
    }

    // Check OTP scam
    if (content.includes('otp') && (content.includes('share') || content.includes('tell'))) {
      reasons.push('OTP sharing request detected');
      riskScore += 30;
      scamType = 'otp_scam';
    }

    // Check UPI/Govt scams
    for (const pattern of SCAM_PATTERNS.upiGovt) {
      if (content.includes(pattern)) {
        warnings.push(`UPI/Govt reference: "${pattern}"`);
        riskScore += 5;
        break;
      }
    }

    // Check job scams
    for (const pattern of SCAM_PATTERNS.jobScam) {
      if (content.includes(pattern)) {
        warnings.push(`Job scam pattern: "${pattern}"`);
        riskScore += 15;
        scamType = 'job_scam';
        break;
      }
    }

    // Check investment scams
    for (const pattern of SCAM_PATTERNS.investmentScam) {
      if (content.includes(pattern)) {
        warnings.push(`Investment pattern: "${pattern}"`);
        riskScore += 15;
        scamType = 'investment_scam';
        break;
      }
    }

    // Check for URLs in message
    if (content.includes('http') || content.includes('www') || content.includes('.com') || content.includes('.in')) {
      warnings.push('Contains URL - verify before clicking');
      riskScore += 10;
    }

    // Check for phone numbers
    if (/\d{10,}/.test(request.content)) {
      warnings.push('Contains phone number - verify caller');
      riskScore += 5;
    }

    // Determine if scam
    const isScam = riskScore >= 60;

    // Set scam type if not already set
    if (isScam && !scamType) {
      if (riskScore >= 50) {
        scamType = 'phishing';
      }
    }

    return { isScam, reasons, warnings, scamType, riskScore };
  }

  /**
   * Check URL for malicious patterns
   */
  private checkUrl(
    url: string,
    request: ScamCheckRequest
  ): {
    isScam: boolean;
    reasons: string[];
    warnings: string[];
    scamType?: ScamType;
    riskScore: number;
  } {
    const reasons: string[] = [];
    const warnings: string[] = [];
    let riskScore = 0;
    let scamType: ScamType | undefined;

    const urlLower = url.toLowerCase();

    // Check for suspicious TLDs
    for (const tld of SUSPICIOUS_TLDS) {
      if (urlLower.includes(tld)) {
        reasons.push(`Suspicious TLD: ${tld}`);
        riskScore += 20;
        break;
      }
    }

    // Check for fake bank domains
    for (const domain of FAKE_BANK_DOMAINS) {
      if (urlLower.includes(domain)) {
        reasons.push(`Bank impersonation domain: ${domain}`);
        riskScore += 30;
        scamType = 'bank_scam';
        break;
      }
    }

    // Check for IP address instead of domain
    if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url)) {
      reasons.push('URL contains IP address instead of domain');
      riskScore += 25;
    }

    // Check for URL shorteners
    if (urlLower.includes('bit.ly') || urlLower.includes('tinyurl') ||
        urlLower.includes('goo.gl') || urlLower.includes('t.co')) {
      warnings.push('URL shortener detected - verify destination');
      riskScore += 15;
    }

    // Check for suspicious keywords in URL
    const suspiciousWords = ['secure', 'login', 'verify', 'update', 'confirm', 'account'];
    for (const word of suspiciousWords) {
      if (urlLower.includes(word)) {
        warnings.push(`Suspicious keyword in URL: ${word}`);
        riskScore += 5;
        break;
      }
    }

    // Check for multiple redirects (dots in subdomain)
    const urlParts = url.split('//');
    if (urlParts.length > 1) {
      const host = urlParts[1].split('/')[0];
      const dots = host.split('.').length;
      if (dots > 3) {
        reasons.push('Multiple subdomains - possible spoofing');
        riskScore += 15;
      }
    }

    // Check for data URI (suspicious)
    if (urlLower.startsWith('data:')) {
      reasons.push('Data URI detected - potential phishing');
      riskScore += 30;
    }

    // Check for @ in URL (can hide real destination)
    if (url.includes('@')) {
      reasons.push('URL contains @ symbol - can hide true destination');
      riskScore += 25;
    }

    // Check for encoded characters
    if (url.includes('%20') || url.includes('%40') || url.includes('%2F')) {
      warnings.push('URL contains encoded characters');
      riskScore += 5;
    }

    const isScam = riskScore >= 50;

    if (isScam && !scamType) {
      scamType = 'phishing';
    }

    return { isScam, reasons, warnings, scamType, riskScore };
  }

  /**
   * Check caller information
   */
  private checkCaller(request: ScamCheckRequest): {
    isScam: boolean;
    reasons: string[];
    warnings: string[];
    scamType?: ScamType;
    riskScore: number;
  } {
    const reasons: string[] = [];
    const warnings: string[] = [];
    let riskScore = 0;

    const phone = request.phone || request.sender || '';

    // Check for international numbers
    if (phone.startsWith('+1') || phone.startsWith('+44') || phone.startsWith('+1')) {
      warnings.push('International caller');
      riskScore += 5;
    }

    // Check for suspicious patterns (too many repeated digits)
    if (/(.)\1{5,}/.test(phone)) {
      reasons.push('Suspicious number pattern');
      riskScore += 20;
    }

    // Check for toll-free being spoofed
    if (phone.startsWith('1800') || phone.startsWith('1866')) {
      warnings.push('Toll-free number - verify caller identity');
      riskScore += 10;
    }

    // Check if number is very short (suspicious)
    if (phone.replace(/\D/g, '').length < 10) {
      reasons.push('Incomplete phone number');
      riskScore += 15;
    }

    const isScam = riskScore >= 40;

    return { isScam, reasons, warnings, scamType: isScam ? 'fake_support' : undefined, riskScore };
  }

  /**
   * Get recommendations based on risk
   */
  private getRecommendations(riskScore: number, scamType?: ScamType): string[] {
    const recommendations: string[] = [];

    if (riskScore >= 70) {
      recommendations.push('DO NOT click any links in this message');
      recommendations.push('DO NOT share any personal information');
      recommendations.push('DO NOT call back the number');
      recommendations.push('Block and report this number');
      recommendations.push('If you shared any information, contact your bank immediately');
    } else if (riskScore >= 50) {
      recommendations.push('Verify the sender through official channels');
      recommendations.push('DO NOT share OTP or passwords');
      recommendations.push('Check your bank statement for suspicious activity');
      recommendations.push('Consider blocking this sender');
    } else {
      recommendations.push('Exercise caution with any requests for personal information');
      recommendations.push('When in doubt, contact the organization directly');
    }

    // Type-specific recommendations
    if (scamType === 'bank_scam') {
      recommendations.push('Your bank will NEVER ask for OTP or password via SMS');
    } else if (scamType === 'otp_scam') {
      recommendations.push('NEVER share OTP with anyone, including family');
    } else if (scamType === 'job_scam') {
      recommendations.push('Verify job offers through official company websites');
    } else if (scamType === 'investment_scam') {
      recommendations.push('Verify investment schemes through SEBI website');
    }

    return recommendations;
  }

  /**
   * Get risk level from score
   */
  getRiskLevel(riskScore: number): RiskLevel {
    if (riskScore >= 70) return 'critical';
    if (riskScore >= 50) return 'high';
    if (riskScore >= 30) return 'medium';
    return 'low';
  }
}

// Singleton export
export const scamDetectionService = new ScamDetectionService();
export default scamDetectionService;
