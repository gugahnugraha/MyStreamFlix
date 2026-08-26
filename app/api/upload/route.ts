import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { google } from "googleapis";
import { Readable } from "stream";

// ─── Google Drive Upload ────────────────────────────────────────────────────
async function uploadToGoogleDrive(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  folderId?: string
): Promise<string> {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!serviceAccountEmail || !privateKey) {
    throw new Error(
      "Google Drive credentials are not configured. Please set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY."
    );
  }

  const auth = new google.auth.JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });

  const drive = google.drive({ version: "v3", auth });

  const fileMetadata: { name: string; parents?: string[] } = { name: filename };
  if (folderId) fileMetadata.parents = [folderId];

  // Convert Buffer to Readable stream for googleapis
  const readableStream = new Readable();
  readableStream.push(buffer);
  readableStream.push(null);

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: {
      mimeType: mimeType || "application/octet-stream",
      body: readableStream,
    },
    fields: "id",
  });

  const fileId = response.data.id;
  if (!fileId) throw new Error("Google Drive upload failed: no file ID returned.");

  // Make file publicly readable (anyone with the link)
  await drive.permissions.create({
    fileId,
    requestBody: { role: "reader", type: "anyone" },
  });

  // Return a direct-access URL
  // For video: export=download allows direct playback in some players
  const isVideo = mimeType.startsWith("video/");
  return isVideo
    ? `https://drive.google.com/uc?export=download&id=${fileId}`
    : `https://drive.google.com/uc?id=${fileId}`;
}

// ─── Route Handler ──────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { searchParams } = new URL(req.url);
    const folder = searchParams.get("folder") || "";
    // provider: 'gdrive' | 'r2' | 'auto' (default)
    const provider = searchParams.get("provider") || "auto";

    const filename = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const key = folder ? `${folder}/${filename}` : filename;

    // ── Google Drive ──────────────────────────────────────────────────────
    if (provider === "gdrive") {
      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
      const url = await uploadToGoogleDrive(
        buffer,
        filename,
        file.type || "application/octet-stream",
        folderId
      );
      return NextResponse.json({ url, provider: "gdrive" });
    }

    // ── Cloudflare R2 ─────────────────────────────────────────────────────
    const r2Endpoint = process.env.R2_ENDPOINT;
    const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
    const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const r2BucketName = process.env.R2_BUCKET_NAME || "my-streamflix";
    const r2PublicUrl = (process.env.R2_PUBLIC_URL || "https://cdn.mystreamflix.biz.id").replace(/\/$/, "");

    if (r2Endpoint && r2AccessKeyId && r2SecretAccessKey) {
      const s3Client = new S3Client({
        region: "auto",
        endpoint: r2Endpoint,
        credentials: {
          accessKeyId: r2AccessKeyId,
          secretAccessKey: r2SecretAccessKey,
        },
      });

      await s3Client.send(
        new PutObjectCommand({
          Bucket: r2BucketName,
          Key: key,
          Body: buffer,
          ContentType: file.type || "application/octet-stream",
        })
      );

      const url = `${r2PublicUrl}/${key}`;
      return NextResponse.json({ url, provider: "r2" });
    }

    // ── Local Disk Storage Fallback (offline development) ─────────────────
    const uploadDir = folder
      ? path.join(process.cwd(), "public", "uploads", folder)
      : path.join(process.cwd(), "public", "uploads");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    const url = folder ? `/uploads/${folder}/${filename}` : `/uploads/${filename}`;
    return NextResponse.json({ url, provider: "local" });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
