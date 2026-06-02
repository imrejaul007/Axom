/**
 * PlanService — Sprint 11: Social Invites
 *
 * Core logic for plan creation, application, selection, confirmation,
 * ghost handling, and refund/credit flows.
 */
import { PlanCategory, PlanVisibility, GenderPref, PlanVibe } from '@prisma/client';
export interface CreatePlanInput {
    organizerId: string;
    category: PlanCategory;
    merchantId: string;
    merchantName: string;
    rezBookingRef: string;
    title: string;
    scheduledAt: Date;
    city: string;
    genderPreference?: GenderPref;
    ageMin?: number;
    ageMax?: number;
    visibility?: PlanVisibility;
    verifiedOnly?: boolean;
    vibe?: PlanVibe;
    experienceCreditId?: string;
}
export declare class PlanService {
    createPlan(input: CreatePlanInput): Promise<{
        status: import(".prisma/client").$Enums.PlanStatus;
        id: string;
        lat: number;
        lng: number;
        createdAt: Date;
        updatedAt: Date;
        venue: string;
        bookingId: string | null;
        title: string;
        creatorId: string;
        description: string | null;
        category: import(".prisma/client").$Enums.PlanCategory;
        coverImage: string | null;
        dateTime: Date;
        timezone: string;
        address: string | null;
        totalSlots: number;
        filledSlots: number;
        isBooked: boolean;
        minKarma: number | null;
        genderPref: import(".prisma/client").$Enums.Gender | null;
    }>;
    getFeed(viewerId: string, params?: {
        city?: string;
        explore?: boolean;
        cursor?: string;
    }): Promise<{
        plans: {
            status: import(".prisma/client").$Enums.PlanStatus;
            id: string;
            lat: number;
            lng: number;
            createdAt: Date;
            updatedAt: Date;
            venue: string;
            bookingId: string | null;
            title: string;
            creatorId: string;
            description: string | null;
            category: import(".prisma/client").$Enums.PlanCategory;
            coverImage: string | null;
            dateTime: Date;
            timezone: string;
            address: string | null;
            totalSlots: number;
            filledSlots: number;
            isBooked: boolean;
            minKarma: number | null;
            genderPref: import(".prisma/client").$Enums.Gender | null;
        }[];
        nextCursor: any;
    }>;
    getPlan(planId: string, viewerId: string): Promise<{
        status: import(".prisma/client").$Enums.PlanStatus;
        id: string;
        lat: number;
        lng: number;
        createdAt: Date;
        updatedAt: Date;
        venue: string;
        bookingId: string | null;
        title: string;
        creatorId: string;
        description: string | null;
        category: import(".prisma/client").$Enums.PlanCategory;
        coverImage: string | null;
        dateTime: Date;
        timezone: string;
        address: string | null;
        totalSlots: number;
        filledSlots: number;
        isBooked: boolean;
        minKarma: number | null;
        genderPref: import(".prisma/client").$Enums.Gender | null;
    }>;
    applyToPlan(planId: string, applicantId: string, note?: string): Promise<any>;
    withdrawApplication(planId: string, applicantId: string): Promise<void>;
    getApplications(planId: string, organizerId: string): Promise<any>;
    selectApplicant(planId: string, organizerId: string, applicantId: string): Promise<{
        matchId: any;
        planId: string;
    }>;
    confirmAttendance(planId: string, profileId: string): Promise<{
        confirmed: boolean;
        coinsCredited: boolean;
    }>;
    cancelPlan(planId: string, organizerId: string): Promise<{
        cancelled: boolean;
    }>;
    reselect(planId: string, organizerId: string, newApplicantId: string): Promise<{
        matchId: any;
        planId: string;
    }>;
    getMyPlans(profileId: string): Promise<{
        organized: any;
        applied: any;
    }>;
    private _handleCancellationRefund;
}
//# sourceMappingURL=PlanService.d.ts.map