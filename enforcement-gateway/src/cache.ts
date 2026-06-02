/**
 * Rule Cache - Fast rule lookups for real-time enforcement
 */

import type { CachedRule } from './types.js';

export class RuleCache {
  private cache: Map<string, CachedRule> = new Map();
  private ttl: number;
  private maxSize: number;

  constructor(ttlMinutes: number = 5, maxSize: number = 10000) {
    this.ttl = ttlMinutes * 60 * 1000;
    this.maxSize = maxSize;

    // Cleanup old entries periodically
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Set rule in cache
   */
  set(rule: CachedRule): void {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt);
      const toRemove = entries.slice(0, Math.floor(this.maxSize * 0.2));
      toRemove.forEach(([key]) => this.cache.delete(key));
    }

    this.cache.set(rule.id, {
      ...rule,
      expiresAt: Date.now() + this.ttl,
    });
  }

  /**
   * Get rule from cache
   */
  get(id: string): CachedRule | null {
    const rule = this.cache.get(id);
    if (!rule) return null;

    if (rule.expiresAt < Date.now()) {
      this.cache.delete(id);
      return null;
    }

    return rule;
  }

  /**
   * Check if rule exists and is valid
   */
  has(id: string): boolean {
    return this.get(id) !== null;
  }

  /**
   * Bulk set rules
   */
  setMany(rules: CachedRule[]): void {
    rules.forEach(rule => this.set(rule));
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need tracking
    };
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [id, rule] of this.cache.entries()) {
      if (rule.expiresAt < now) {
        this.cache.delete(id);
      }
    }
  }
}

// Singleton
export const ruleCache = new RuleCache();
