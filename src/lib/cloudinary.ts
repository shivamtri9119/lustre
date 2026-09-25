import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const INVOICE_TTL_DAYS = 30;

/**
 * Uploads a generated invoice PDF to Cloudinary as a raw resource, under
 * invoices/<publicId>. Returns the hosted URL, the Cloudinary public_id
 * (needed later to delete it), and the 30-day expiry timestamp that the
 * cleanup cron (see /api/cron/cleanup-expired-invoices) checks against.
 */
export async function uploadInvoicePdf(buffer: Buffer, publicId: string) {
  const base64 = `data:application/pdf;base64,${buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(base64, {
    resource_type: "raw",
    public_id: publicId,
    folder: "invoices",
    overwrite: true,
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
    expiresAt: new Date(Date.now() + INVOICE_TTL_DAYS * 24 * 60 * 60 * 1000),
  };
}

/** Deletes a previously-uploaded invoice PDF. Used by the 30-day cleanup cron. */
export async function deleteInvoicePdf(publicId: string) {
  await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
}

export { INVOICE_TTL_DAYS };
