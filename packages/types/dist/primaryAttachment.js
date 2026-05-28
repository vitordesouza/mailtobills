const POSITIVE_FILENAME_TERMS = [
    "fatura",
    "factura",
    "invoice",
    "recibo",
    "bill",
    "pagamento",
];
const NOISE_FILENAME_TERMS = [
    "ads",
    "promo",
    "marketing",
    "terms",
    "condicoes",
    "welcome",
    "folheto",
];
const MIME_TYPE_PDF_BONUS = 20;
const POSITIVE_TERM_BONUS = 12;
const NOISE_TERM_PENALTY = 16;
const MAX_REASONABLE_PDF_SIZE_BYTES = 20 * 1024 * 1024;
const SIZE_BUCKET_BYTES = 256 * 1024;
const MAX_SIZE_BONUS = 24;
function normalize(value) {
    return (value ?? "")
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .trim();
}
function isPdfCandidate(candidate) {
    const mimeType = normalize(candidate.mimeType);
    const filename = normalize(candidate.filename);
    return mimeType === "application/pdf" || filename.endsWith(".pdf");
}
function getReasonableSizeBonus(fileSize) {
    if (!fileSize || fileSize <= 0)
        return 0;
    const cappedSize = Math.min(fileSize, MAX_REASONABLE_PDF_SIZE_BYTES);
    return Math.min(Math.floor(cappedSize / SIZE_BUCKET_BYTES), MAX_SIZE_BONUS);
}
export function scoreAttachmentCandidate(candidate) {
    const normalizedFilename = normalize(candidate.filename);
    const normalizedMimeType = normalize(candidate.mimeType);
    const isAcceptedPdf = isPdfCandidate(candidate);
    if (!isAcceptedPdf) {
        return { ...candidate, isAcceptedPdf: false, score: Number.NEGATIVE_INFINITY };
    }
    let score = 0;
    if (normalizedMimeType === "application/pdf") {
        score += MIME_TYPE_PDF_BONUS;
    }
    for (const term of POSITIVE_FILENAME_TERMS) {
        if (normalizedFilename.includes(term)) {
            score += POSITIVE_TERM_BONUS;
        }
    }
    for (const term of NOISE_FILENAME_TERMS) {
        if (normalizedFilename.includes(term)) {
            score -= NOISE_TERM_PENALTY;
        }
    }
    score += getReasonableSizeBonus(candidate.fileSize);
    return { ...candidate, isAcceptedPdf: true, score };
}
export function choosePrimaryAttachment(candidates) {
    const scored = candidates
        .map((candidate) => ({
        candidate,
        result: scoreAttachmentCandidate(candidate),
    }))
        .filter(({ result }) => result.isAcceptedPdf);
    if (scored.length === 0) {
        return null;
    }
    scored.sort((a, b) => {
        const scoreDiff = b.result.score - a.result.score;
        if (scoreDiff !== 0)
            return scoreDiff;
        return a.candidate.originalOrder - b.candidate.originalOrder;
    });
    return scored[0]?.candidate ?? null;
}
export function getAcceptedPdfAttachments(candidates) {
    return candidates.filter((candidate) => scoreAttachmentCandidate(candidate).isAcceptedPdf);
}
