export function normalizeBase64Payload(value) {
    const [, rawPayload = value] = value.split(",");
    const normalizedPayload = rawPayload
        .replace(/\s/g, "")
        .replace(/-/g, "+")
        .replace(/_/g, "/");
    if (normalizedPayload.length % 4 === 1) {
        throw new Error("Invalid base64 payload length");
    }
    return normalizedPayload.padEnd(normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4), "=");
}
