import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(request: NextRequest) {
  try {
    console.log("Upload API called");
    
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      console.error("No file found in request");
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    console.log("File details:", {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Validate file type
    const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const allowedVideoTypes = ["video/mp4"];
    const isImage = allowedImageTypes.includes(file.type);
    const isVideo = allowedVideoTypes.includes(file.type);
    
    if (!isImage && !isVideo) {
      console.error("Invalid file type:", file.type);
      return NextResponse.json({ 
        error: `Invalid file type: ${file.type}. Allowed: ${[...allowedImageTypes, ...allowedVideoTypes].join(", ")}` 
      }, { status: 400 });
    }

    // Validate file size - FIXED LIMITS
    const maxImageSize = 5 * 1024 * 1024; // 5MB for images
    const maxVideoSize = 50 * 1024 * 1024; // 50MB for videos
    
    if (isImage && file.size > maxImageSize) {
      console.error("Image too large:", file.size, "bytes");
      return NextResponse.json({ 
        error: `Image size must be less than 5MB. Current size: ${Math.round(file.size / 1024 / 1024 * 100) / 100}MB` 
      }, { status: 400 });
    }
    
    if (isVideo && file.size > maxVideoSize) {
      console.error("Video too large:", file.size, "bytes");
      return NextResponse.json({ 
        error: `Video size must be less than 50MB. Current size: ${Math.round(file.size / 1024 / 1024 * 100) / 100}MB` 
      }, { status: 400 });
    }

    // Check for Vercel Blob token
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
    if (!token) {
      console.error("Missing Vercel Blob token");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    console.log("Uploading to Vercel Blob...");

    // Generate unique filename to prevent conflicts
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${timestamp}-${randomSuffix}.${fileExtension}`;

    // Convert File to ArrayBuffer, then to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("Uploading file:", uniqueFileName, "Size:", buffer.length, "bytes");

    const blob = await put(uniqueFileName, buffer, {
      access: "public",
      token,
      contentType: file.type,
    });

    console.log("Upload successful:", blob.url);

    return NextResponse.json({ 
      url: blob.url,
      size: file.size,
      type: file.type,
      originalName: file.name 
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ 
      error: "Upload failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}