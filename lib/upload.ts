import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Ensure upload directories exist
export async function ensureUploadDirs() {
  const dirs = [
    path.join(process.cwd(), 'public', 'uploads', 'videos'),
    path.join(process.cwd(), 'public', 'uploads', 'thumbnails'),
  ];

  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }
}

// Generate unique filename
export function generateUniqueFilename(originalName: string): string {
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  const timestamp = Date.now();
  const uuid = uuidv4().substring(0, 8);
  return `${timestamp}-${uuid}${extension}`;
}

// Validate file type and size
export function validateVideoFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  const maxSize = 100 * 1024 * 1024; // 100MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only MP4, WebM, and MOV files are allowed.'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size too large. Maximum size is 100MB.'
    };
  }

  return { valid: true };
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid image type. Only JPG, PNG, and WebP files are allowed.'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Image size too large. Maximum size is 5MB.'
    };
  }

  return { valid: true };
}

// Save uploaded file
export async function saveUploadedFile(
  file: File,
  subDir: 'videos' | 'thumbnails'
): Promise<{ filename: string; filepath: string; url: string }> {
  await ensureUploadDirs();

  const filename = generateUniqueFilename(file.name);
  const filepath = path.join(process.cwd(), 'public', 'uploads', subDir, filename);
  const url = `/uploads/${subDir}/${filename}`;

  // Convert file to buffer and save
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  await fs.writeFile(filepath, buffer);

  return { filename, filepath, url };
}

// Get video duration (client-side helper)
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(Math.floor(video.duration));
    };

    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
    };

    video.src = URL.createObjectURL(file);
  });
}

// Delete file
export async function deleteFile(filepath: string): Promise<void> {
  try {
    await fs.unlink(filepath);
  } catch (error) {
    console.error('Error deleting file:', error);
    // Don't throw error for cleanup operations
  }
}

// Clean up old files (utility for maintenance)
export async function cleanupOldFiles(daysOld: number = 30): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const dirs = ['videos', 'thumbnails'];

  for (const dir of dirs) {
    const dirPath = path.join(process.cwd(), 'public', 'uploads', dir);

    try {
      const files = await fs.readdir(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          console.log(`Cleaned up old file: ${file}`);
        }
      }
    } catch (error) {
      console.error(`Error cleaning up ${dir}:`, error);
    }
  }
}