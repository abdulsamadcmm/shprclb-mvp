import { defineMiddlewares } from "@medusajs/framework/http"
import type { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"
import path from "path"
import express from "express"

const uploadsDir = path.join(process.cwd(), "uploads")
const staticMiddleware = express.static(uploadsDir)

/** Serves uploaded design files at GET /uploads/designs/<filename>. When mounted at /uploads, req.url is already the suffix (e.g. /designs/xxx.png). */
function serveUploads(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction): void {
  staticMiddleware(req, res, next)
}

/**
 * Custom body parser limit for store file-upload (base64 JSON payloads can exceed 100kb).
 * Framework default is 100kb; this route needs 10mb for design uploads.
 */
export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/file-upload",
      methods: ["POST"],
      bodyParser: {
        sizeLimit: "10mb",
      },
    },
    {
      matcher: "/uploads",
      middlewares: [serveUploads],
    },
  ],
})
