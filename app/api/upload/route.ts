import { NextRequest, NextResponse } from "next/server";


import { put } from "@vercel/blob";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.startsWith("multipart/form-data")) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
    }

    // Read the request body as a stream
    const boundary = contentType.split("boundary=")[1];
    if (!boundary) {
      return NextResponse.json({ error: "No boundary found" }, { status: 400 });
    }

    // Buffer the request body
    const chunks = [];
    for await (const chunk of request.body as any) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Parse the multipart form data manually
    const parts = buffer.toString().split(`--${boundary}`);
    let fileBuffer: Buffer | null = null;
    let fileName = "";
    let fileType = "";
    for (const part of parts) {
      if (part.includes("Content-Disposition: form-data; name=\"file\";")) {
        // Extract filename
        const match = part.match(/filename=\"(.+?)\"/);
        if (match) fileName = match[1];
        // Extract file type
        const typeMatch = part.match(/Content-Type: (.+)/);
        if (typeMatch) fileType = typeMatch[1].trim();
        // Extract file data
        const start = part.indexOf("\r\n\r\n");
        if (start !== -1) {
          const fileData = part.substring(start + 4, part.lastIndexOf("\r\n"));
          fileBuffer = Buffer.from(fileData, "binary");
        }
      }
    }

    if (!fileBuffer || !fileName) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type and size
    const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
    const allowedVideoTypes = ["video/mp4"];
    const isImage = allowedImageTypes.includes(fileType);
    const isVideo = allowedVideoTypes.includes(fileType);
    if (!isImage && !isVideo) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }
    if (isImage && fileBuffer.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image size must be less than 5MB" }, { status: 400 });
    }
    if (isVideo && fileBuffer.length > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "Video size must be less than 50MB" }, { status: 400 });
    }

    // Upload to Vercel Blob
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "Missing Vercel Blob token" }, { status: 500 });
    }

    const blob = await put(fileName, fileBuffer, {
      access: "public",
      token,
      contentType: fileType,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}