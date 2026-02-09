import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/svg+xml",
];
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "designs");

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error("Failed to create upload directory:", error);
  }
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    await ensureUploadDir();

    // Get body - handle both string and parsed JSON
    let body: any = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        res.status(400).json({
          type: "invalid_data",
          message: "Invalid JSON body",
        });
        return;
      }
    }

    if (!body || !body.file_data) {
      res.status(400).json({
        type: "invalid_data",
        message: "No file data provided",
      });
      return;
    }

    // Decode base64 file
    let base64Data: string;
    try {
      base64Data = body.file_data.replace(/^data:.*,/, "");
      if (!base64Data || base64Data.length === 0) {
        throw new Error("Empty base64 data");
      }
    } catch (e) {
      res.status(400).json({
        type: "invalid_data",
        message: "Invalid base64 file data",
      });
      return;
    }

    let fileBuffer: Buffer;
    try {
      fileBuffer = Buffer.from(base64Data, "base64");
    } catch (e) {
      res.status(400).json({
        type: "invalid_data",
        message: "Failed to decode base64 data",
      });
      return;
    }
    const fileSize = fileBuffer.length;

    // Validate file size
    if (fileSize > MAX_FILE_SIZE) {
      res.status(400).json({
        type: "invalid_data",
        message: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      });
      return;
    }

    // Validate file type
    const mimeType = body.mime_type || "application/octet-stream";
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      res.status(400).json({
        type: "invalid_data",
        message: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`,
      });
      return;
    }

    // Determine file extension from mime type
    const extensionMap: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/jpg": ".jpg",
      "image/png": ".png",
      "image/svg+xml": ".svg",
    };
    const fileExtension = extensionMap[mimeType] || ".jpg";

    // Generate unique filename
    let uniqueFileName: string;
    try {
      uniqueFileName = `${crypto.randomUUID()}${fileExtension}`;
    } catch (e) {
      uniqueFileName = `${crypto.randomBytes(16).toString("hex")}${fileExtension}`;
    }
    const filePath = path.join(UPLOAD_DIR, uniqueFileName);

    // Save file
    await fs.writeFile(filePath, fileBuffer);

    // Return file URL (relative to Medusa server)
    const fileUrl = `/uploads/designs/${uniqueFileName}`;
    const fileId = uniqueFileName.replace(fileExtension, "");

    res.json({
      file_url: fileUrl,
      file_id: fileId,
      file_name: body.file_name || "design",
      file_size: fileSize,
      mime_type: mimeType,
    });
  } catch (error) {
    console.error("File upload error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      type: "server_error",
      message: `Failed to upload file: ${errorMessage}`,
    });
  }
}
