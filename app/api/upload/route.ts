import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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
    
    const provider = process.env.UPLOAD_PROVIDER || "local";
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const key = folder ? `${folder}/${filename}` : filename;

    if (provider === "local") {
      const uploadDir = folder 
        ? path.join(process.cwd(), "public", "uploads", folder)
        : path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, buffer);
      
      const url = folder ? `/uploads/${folder}/${filename}` : `/uploads/${filename}`;
      return NextResponse.json({ url });
    } 
    
    if (provider === "bunnynet") {
      const storageZone = process.env.BUNNY_STORAGE_ZONE;
      const apiKey = process.env.BUNNY_API_KEY;
      const pullZoneUrl = process.env.BUNNY_PULL_ZONE_URL;

      if (!storageZone || !apiKey || !pullZoneUrl) {
        return NextResponse.json({ error: "Bunny.net credentials not configured" }, { status: 500 });
      }

      // Upload to Bunny.net via HTTP PUT
      const bunnyUrl = `https://storage.bunnycdn.com/${storageZone}/${key}`;
      const response = await fetch(bunnyUrl, {
        method: "PUT",
        headers: {
          AccessKey: apiKey,
          "Content-Type": file.type || "application/octet-stream",
        },
        body: buffer,
      });

      if (!response.ok) {
        throw new Error(`Bunny.net upload failed: ${response.statusText}`);
      }

      const url = `${pullZoneUrl.replace(/\/$/, "")}/${key}`;
      return NextResponse.json({ url });
    } 
    
    if (provider === "s3" || provider === "r2" || provider === "gcs") {
      const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
      
      let clientConfig: any = {};
      let bucketName = "";
      let publicUrlPrefix = "";

      if (provider === "s3") {
        clientConfig = {
          region: process.env.AWS_REGION || "us-east-1",
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
          },
        };
        bucketName = process.env.AWS_BUCKET_NAME || "";
        publicUrlPrefix = `https://${bucketName}.s3.${clientConfig.region}.amazonaws.com`;
      } else if (provider === "r2") {
        clientConfig = {
          endpoint: process.env.R2_ENDPOINT || "",
          region: "auto",
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
          },
          forcePathStyle: true,
        };
        bucketName = process.env.R2_BUCKET_NAME || "";
        publicUrlPrefix = process.env.R2_PUBLIC_URL || "";
      } else if (provider === "gcs") {
        clientConfig = {
          endpoint: "https://storage.googleapis.com",
          region: "auto",
          credentials: {
            accessKeyId: process.env.GCS_ACCESS_KEY_ID || "",
            secretAccessKey: process.env.GCS_SECRET_ACCESS_KEY || "",
          },
          forcePathStyle: true,
        };
        bucketName = process.env.GCS_BUCKET_NAME || "";
        publicUrlPrefix = `https://storage.googleapis.com/${bucketName}`;
      }

      if (!bucketName) {
        return NextResponse.json({ error: `${provider.toUpperCase()} bucket name not configured` }, { status: 500 });
      }

      const client = new S3Client(clientConfig);
      await client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: buffer,
          ContentType: file.type || "video/mp4",
          ACL: provider === "s3" || provider === "gcs" ? "public-read" : undefined,
        })
      );

      const url = `${publicUrlPrefix.replace(/\/$/, "")}/${key}`;
      return NextResponse.json({ url });
    }

    return NextResponse.json({ error: "Unsupported upload provider" }, { status: 400 });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
