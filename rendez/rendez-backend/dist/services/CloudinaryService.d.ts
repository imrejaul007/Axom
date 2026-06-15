export interface UploadResult {
    url: string;
    publicId: string;
    width: number;
    height: number;
}
export declare function uploadProfilePhoto(buffer: Buffer, profileId: string, index: number): Promise<UploadResult>;
export declare function deleteProfilePhoto(publicId: string): Promise<void>;
//# sourceMappingURL=CloudinaryService.d.ts.map