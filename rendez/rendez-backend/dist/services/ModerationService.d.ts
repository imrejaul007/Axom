import { ReportReason } from '@prisma/client';
export declare class ModerationService {
    reportUser(reporterId: string, reportedId: string, reason: ReportReason, detail?: string): Promise<void>;
    blockUser(blockerId: string, blockedId: string): Promise<void>;
    getBlocks(profileId: string): Promise<any>;
    unblock(blockerId: string, blockedId: string): Promise<void>;
}
//# sourceMappingURL=ModerationService.d.ts.map