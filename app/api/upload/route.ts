import { NextRequest, NextResponse } from "next/server";

import path from "path";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
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
    for await (const chunk of req.body as any) {
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

    // Save file to public/uploads
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + "-" + fileName.replace(/\s+/g, "_");
    const filePath = path.join(uploadDir, uniqueName);
    fs.writeFileSync(filePath, fileBuffer);

    const url = `/uploads/${uniqueName}`;
    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}