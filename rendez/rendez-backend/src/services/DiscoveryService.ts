import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { Gender, Intent } from '@prisma/client';
import { computeTrustSignals } from '../utils/trust';

const FEED_TTL = 1800; // 30 min
const FEED_SIZE = 50;

interface DiscoveryFilters {
  city?: string;
  minAge?: number;
  maxAge?: number;
  intent?: Intent;
}

export class DiscoveryService {
  async getFeed(profileId: string, filters?: DiscoveryFilters): Promise<object[]> {
    const cacheKey = `discovery:${profileId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      try { return JSON.parse(cached); }
      catch { /* corrupt cache — rebuild */ }
    }

    const viewer = await prisma.profile.findUnique({ where: { id: profileId } });
    if (!viewer) return [];

    // Sprint 12: if viewer has onlyVerifiedCanLike, only verified profiles can appear in their feed
    // (prevents wasted likes from unverified users who will be blocked anyway)
    const viewerIsVerified = viewer.isVerified;

    const [likedIds, blockedIds] = await Promise.all([
      prisma.like.findMany({ where: { fromUserId: profileId }, select: { toUserId: true } }),
      prisma.block.findMany({
        where: { OR: [{ blockerId: profileId }, { blockedId: profileId }] },
        select: { blockerId: true, blockedId: true },
      }),
    ]);

    const excludeIds = new Set([
      profileId,
      ...likedIds.map((l) => l.toUserId),
      ...blockedIds.flatMap((b) => [b.blockerId, b.blockedId]),
    ]);

    const candidates = await prisma.profile.findMany({
      where: {
        id: { notIn: Array.from(excludeIds) },
        isActive: true,
        // Candidate's gender must be in viewer's interestedIn
        gender: { in: viewer.interestedIn as Gender[] },
        // Mutual attraction: candidate must be interested in viewer's gender
        interestedIn: { has: viewer.gender },
        city: filters?.city || viewer.city,
        age: {
          gte: filters?.minAge || viewer.age - 5,
          lte: filters?.maxAge || viewer.age + 10,
        },
        ...(filters?.intent && { intent: filters.intent }),
      },
      select: {
        id: true, name: true, age: true, gender: true, city: true,
        photos: true, bio: true, intent: true, isVerified: true,
        profileScore: true, rezSpendScore: true, lastActiveAt: true,
        lat: true, lng: true,
        // Sprint 13 trust signals (exposed to frontend)
        responseRate: true, meetupCount: true,
        // Sprint 12 safety fields for feed filtering (stripped before return)
        onlyVerifiedCanLike: true, shadowScore: true,
      },
      take: FEED_SIZE * 3,
    });

    const scored = candidates
      // Sprint 12: filter out candidates who want verified-only if viewer is not verified
      .filter((c) => !c.onlyVerifiedCanLike || viewerIsVerified)
      .map((c) => ({
        ...c,
        // Sprint 12: shadowScore penalty — creeps sink below 0 in effective score
        _score: this.computeScore(viewer, c) - (c.shadowScore / 100) * 0.4,
      }))
      .sort((a, b) => b._score - a._score)
      .slice(0, FEED_SIZE);

    // Strip internal fields and precise coordinates; inject computed trust signals
    const sanitized = scored.map(({ _score, lat, lng, onlyVerifiedCanLike, shadowScore, ...rest }) => ({
      ...rest,
      trustSignals: computeTrustSignals(rest as Parameters<typeof computeTrustSignals>[0]),
    }));

    await redis.setex(cacheKey, FEED_TTL, JSON.stringify(sanitized));
    return sanitized;
  }

  private computeScore(
    viewer: { lat: number | null; lng: number | null; profileScore: number },
    candidate: { lat: number | null; lng: number | null; profileScore: number; rezSpendScore: number; lastActiveAt: Date; photos: string[]; bio: string | null; [key: string]: unknown },
  ): number {
    const distanceScore = this.distanceScore(viewer.lat, viewer.lng, candidate.lat, candidate.lng);
    const activityScore = this.activityScore(candidate.lastActiveAt);
    const completeness = this.completenessScore(candidate);

    return (
      distanceScore * 0.3 +
      activityScore * 0.2 +
      (candidate.rezSpendScore / 100) * 0.15 +
      completeness * 0.1 +
      (candidate.profileScore / 100) * 0.25
    );
  }

  private distanceScore(lat1: number | null, lng1: number | null, lat2: number | null, lng2: number | null): number {
    if (!lat1 || !lng1 || !lat2 || !lng2) return 0.5;
    const dist = Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2)) * 111;
    return Math.max(0, 1 - dist / 50);
  }

  private activityScore(lastActiveAt: Date): number {
    const days = (Date.now() - lastActiveAt.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, 1 - days / 7);
  }

  private completenessScore(c: { photos: string[]; bio: string | null }): number {
    let score = 0;
    if (c.photos.length >= 3) score += 0.5;
    else if (c.photos.length >= 1) score += 0.25;
    if (c.bio && c.bio.length > 20) score += 0.5;
    return score;
  }

  async invalidateFeed(profileId: string): Promise<void> {
    await redis.del(`discovery:${profileId}`);
  }
}
