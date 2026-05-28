export type AttachmentCandidateInput = {
    filename: string;
    mimeType?: string;
    fileSize?: number;
    originalOrder: number;
};
export type ScoredAttachmentCandidate = AttachmentCandidateInput & {
    isAcceptedPdf: boolean;
    score: number;
};
export declare function scoreAttachmentCandidate(candidate: AttachmentCandidateInput): ScoredAttachmentCandidate;
export declare function choosePrimaryAttachment<T extends AttachmentCandidateInput>(candidates: readonly T[]): T | null;
export declare function getAcceptedPdfAttachments<T extends AttachmentCandidateInput>(candidates: readonly T[]): T[];
//# sourceMappingURL=primaryAttachment.d.ts.map