import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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

    const filename = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const key = folder ? `${folder}/${filename}` : filename;

    // Cloudflare R2 S3 Upload Configuration
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

    // Local Disk Storage Fallback (for offline development)
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
