export interface Invoice {
    id: string;
    userId: string;
    originalFilename: string;
    fileUrl: string;
    fromEmail?: string;
    subject?: string;
    receivedAt: number;
    createdAt: number;
}
export type InvoiceRow = {
    id: string;
    originalFilename: string;
    fromEmail?: string;
    subject?: string;
    receivedAt: number;
    createdAt: number;
    fileUrl?: string;
};
//# sourceMappingURL=invoice.d.ts.map