/**
 * TrustOS Compliance SDK Errors
 */

export class ComplianceError extends Error {
  public code: string;
  public details?: Record<string, any>;

  constructor(message: string, code?: string, details?: Record<string, any>) {
    super(message);
    this.name = 'ComplianceError';
    this.code = code || 'COMPLIANCE_ERROR';
    this.details = details;
  }
}

export class ServiceUnavailableError extends ComplianceError {
  constructor(service: string, details?: Record<string, any>) {
    super(`${service} service is temporarily unavailable`, 'SERVICE_UNAVAILABLE', details);
    this.name = 'ServiceUnavailableError';
  }
}

export class ValidationError extends ComplianceError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class PermissionDeniedError extends ComplianceError {
  constructor(action: string, details?: Record<string, any>) {
    super(`Permission denied for action: ${action}`, 'PERMISSION_DENIED', details);
    this.name = 'PermissionDeniedError';
  }
}

export class TimeoutError extends ComplianceError {
  constructor(service: string, timeout: number, details?: Record<string, any>) {
    super(`${service} request timed out after ${timeout}ms`, 'TIMEOUT', details);
    this.name = 'TimeoutError';
  }
}

export class CircuitBreakerOpenError extends ComplianceError {
  constructor(service: string, details?: Record<string, any>) {
    super(`Circuit breaker is open for ${service}`, 'CIRCUIT_BREAKER_OPEN', details);
    this.name = 'CircuitBreakerOpenError';
  }
}
