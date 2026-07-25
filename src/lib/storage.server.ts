import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

let client: S3Client | null = null;

function s3(): S3Client {
  if (!client) {
    client = new S3Client({
      region: process.env.S3_REGION || "us-east-1",
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || "",
        secretAccessKey: process.env.S3_SECRET_KEY || "",
      },
    });
  }
  return client;
}

export async function uploadBase64(base64DataUrl: string, keyPrefix: string): Promise<string> {
  const bucket = process.env.S3_BUCKET || "squadia";
  const publicBase = process.env.S3_PUBLIC_URL || `${process.env.S3_ENDPOINT}/${bucket}`;
  const match = /^data:(image\/[a-z]+);base64,(.+)$/i.exec(base64DataUrl);
  if (!match) throw new Error("Formato de imagem inválido");
  const contentType = match[1];
  const buf = Buffer.from(match[2], "base64");
  const ext = contentType.split("/")[1].replace("jpeg", "jpg");
  const key = `${keyPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  await s3().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buf,
      ContentType: contentType,
      ACL: "public-read",
    }),
  );
  return `${publicBase.replace(/\/$/, "")}/${key}`;
}
