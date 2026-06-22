/**
 * Rendez Backend - User Service
 * @module services/userService
 */

import { v4 as uuidv4 } from 'uuid';
import type { RendezUser } from '../types.js';

const users = new Map<string, RendezUser>();

export class UserService {
  /**
   * Create user profile
   */
  static create(name: string, email: string, interests: string[] = []): RendezUser {
    const user: RendezUser = {
      id: uuidv4(),
      name,
      email,
      interests,
      eventsAttended: 0,
      eventsCreated: 0,
      rating: 0,
      verified: false,
      createdAt: new Date(),
    };
    users.set(user.id, user);
    return user;
  }

  /**
   * Get user by ID
   */
  static getById(id: string): RendezUser | undefined {
    return users.get(id);
  }

  /**
   * Get all users
   */
  static getAll(): RendezUser[] {
    return Array.from(users.values());
  }

  /**
   * Update user profile
   */
  static update(
    id: string,
    updates: Partial<Pick<RendezUser, 'name' | 'avatar' | 'interests' | 'bio'>>
  ): RendezUser | undefined {
    const user = users.get(id);
    if (!user) return undefined;

    const updated = { ...user, ...updates };
    users.set(id, updated);
    return updated;
  }

  /**
   * Search users by interests
   */
  static searchByInterest(interest: string): RendezUser[] {
    const lower = interest.toLowerCase();
    return Array.from(users.values()).filter((u) =>
      u.interests.some((i) => i.toLowerCase().includes(lower))
    );
  }

  /**
   * Increment events attended
   */
  static incrementAttended(id: string): void {
    const user = users.get(id);
    if (user) {
      user.eventsAttended++;
      users.set(id, user);
    }
  }

  /**
   * Increment events created
   */
  static incrementCreated(id: string): void {
    const user = users.get(id);
    if (user) {
      user.eventsCreated++;
      users.set(id, user);
    }
  }
}