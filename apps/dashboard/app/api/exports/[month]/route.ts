import { getExpenseDocuments } from "@/lib/expenseDocuments/getExpenseDocuments";

const textEncoder = new TextEncoder();
const collectionMonthPattern = /^\d{4}-\d{2}$/;

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(value: number) {
  const bytes = new Uint8Array(2);
  new DataView(bytes.buffer).setUint16(0, value, true);
  return bytes;
}

function writeUint32(value: number) {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value, true);
  return bytes;
}

function concat(parts: Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const output = new Uint8Array(total);
  let offset = 0;

  for (const part of parts) {
    output.set(part, offset);
    offset += part.byteLength;
  }

  return output;
}

function csvCell(value: string | number | undefined) {
  const raw = value === undefined ? "" : String(value);
  return `"${raw.replaceAll('"', '""')}"`;
}

function buildManifestCsv(
  rows: Array<{
    id: string;
    filename: string;
    sender?: string;
    subject?: string;
    receivedAt: number;
    attachmentCount: number;
  }>,
) {
  const header = [
    "document id",
    "primary filename",
    "sender",
    "email subject",
    "received timestamp",
    "attachment count",
  ];

  const lines = [
    header.map(csvCell).join(","),
    ...rows.map((row) =>
      [
        row.id,
        row.filename,
        row.sender,
        row.subject,
        new Date(row.receivedAt).toISOString(),
        row.attachmentCount,
      ]
        .map(csvCell)
        .join(","),
    ),
  ];

  return `${lines.join("\n")}\n`;
}

function sanitizeZipName(value: string) {
  return value.replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "");
}

function buildZip(files: Array<{ name: string; bytes: Uint8Array }>) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const filename = textEncoder.encode(file.name);
    const checksum = crc32(file.bytes);

    const localHeader = concat([
      writeUint32(0x04034b50),
      writeUint16(20),
      writeUint16(0),
      writeUint16(0),
      writeUint16(0),
      writeUint16(0),
      writeUint32(checksum),
      writeUint32(file.bytes.byteLength),
      writeUint32(file.bytes.byteLength),
      writeUint16(filename.byteLength),
      writeUint16(0),
      filename,
    ]);

    localParts.push(localHeader, file.bytes);

    centralParts.push(
      concat([
        writeUint32(0x02014b50),
        writeUint16(20),
        writeUint16(20),
        writeUint16(0),
        writeUint16(0),
        writeUint16(0),
        writeUint16(0),
        writeUint32(checksum),
        writeUint32(file.bytes.byteLength),
        writeUint32(file.bytes.byteLength),
        writeUint16(filename.byteLength),
        writeUint16(0),
        writeUint16(0),
        writeUint16(0),
        writeUint16(0),
        writeUint32(0),
        writeUint32(offset),
        filename,
      ]),
    );

    offset += localHeader.byteLength + file.bytes.byteLength;
  }

  const centralDirectory = concat(centralParts);
  const end = concat([
    writeUint32(0x06054b50),
    writeUint16(0),
    writeUint16(0),
    writeUint16(files.length),
    writeUint16(files.length),
    writeUint32(centralDirectory.byteLength),
    writeUint32(offset),
    writeUint16(0),
  ]);

  return concat([...localParts, centralDirectory, end]);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ month: string }> },
) {
  const { month } = await params;

  if (!collectionMonthPattern.test(month)) {
    return new Response("Invalid Collection Month", { status: 400 });
  }

  const { documents } = await getExpenseDocuments(month);
  const origin = new URL(request.url).origin;
  const manifestRows = [];
  const files: Array<{ name: string; bytes: Uint8Array }> = [];

  for (const document of documents) {
    const primary = document.primaryAttachment;

    if (!primary?.downloadUrl) {
      continue;
    }

    const response = await fetch(`${origin}${primary.downloadUrl}`, {
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
    });

    if (!response.ok) {
      continue;
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    const filename = `${sanitizeZipName(document.id)}-${sanitizeZipName(primary.originalFilename)}`;

    files.push({
      name: `pdfs/${filename}`,
      bytes,
    });

    manifestRows.push({
      id: document.id,
      filename: primary.originalFilename,
      sender: document.fromEmail,
      subject: document.subject,
      receivedAt: document.receivedAt,
      attachmentCount: document.attachments.length,
    });
  }

  files.push({
    name: "manifest.csv",
    bytes: textEncoder.encode(buildManifestCsv(manifestRows)),
  });

  const zip = buildZip(files);

  return new Response(zip, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="mailtobills-${month}.zip"`,
      "cache-control": "private, max-age=0, must-revalidate",
    },
  });
}
