export interface RezVerifyResult {
    valid: boolean;
    rez_user_id: string;
    phone: string;
    verified_status: 'verified' | 'unverified' | 'pending';
}
export declare function verifyRezToken(token: string): Promise<RezVerifyResult>;
export declare function linkAccount(rezUserId: string, rendezUserId: string): Promise<void>;
//# sourceMappingURL=rezAuthClient.d.ts.map