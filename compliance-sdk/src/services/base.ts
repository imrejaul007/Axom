/**
 * Base service class with common HTTP utilities
 */

import { SDKConfig } from '../types';
import { ServiceUnavailableError, TimeoutError, ComplianceError, ValidationError } from '../errors';

interface RetryConfig {
  retries: number;
  retryDelay: number;
}

export abstract class BaseService {
  protected config: Required<SDKConfig>;
  protected apiKey?: string;
  protected timeout: number;
  protected retries: number;

  constructor(
    config: SDKConfig,
    apiKey: string | undefined,
    timeout: number,
    retries: number
  ) {
    this.config = config as Required<SDKConfig>;
    this.apiKey = apiKey;
    this.timeout = timeout;
    this.retries = retries;
  }

  protected abstract getServiceUrl(): string;
  protected abstract getServiceName(): string;

  protected async request<T>(
    path: string,
    options: RequestInit = {},
    retryConfig?: RetryConfig
  ): Promise<T> {
    const url = `${this.getServiceUrl()}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      ...(options.headers as Record<string, string>),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const retries = retryConfig?.retries ?? this.retries;
    const retryDelay = retryConfig?.retryDelay ?? 1000;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorBody = await response.text().catch(() => 'Unknown error');
          throw new ComplianceError(
            `HTTP ${response.status}: ${errorBody}`,
            `HTTP_${response.status}`,
            { status: response.status, body: errorBody }
          );
        }

        return response.json();
      } catch (error) {
        lastError = error as Error;

        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new TimeoutError(this.getServiceName(), this.timeout);
          }

          if (error instanceof ComplianceError) {
            throw error;
          }
        }

        // Retry on network errors
        if (attempt < retries) {
          await this.sleep(retryDelay * Math.pow(2, attempt));
        }
      }
    }

    clearTimeout(timeoutId);
    throw new ServiceUnavailableError(this.getServiceName(), {
      message: lastError?.message,
      attempts: retries + 1,
    });
  }

  protected async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  protected async post<T>(path: string, body: any): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  protected async put<T>(path: string, body: any): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  protected async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  protected async health(): Promise<any> {
    return this.get('/health');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected validateRequired(obj: any, fields: string[]): void {
    const missing = fields.filter(field => !obj[field]);
    if (missing.length > 0) {
      throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
    }
  }
}
