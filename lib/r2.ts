/**
 * Cloudflare R2 Storage Client
 * 
 * This module provides functions to interact with Cloudflare R2 storage
 * for uploading and managing PDF files.
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Validate required environment variables
if (!process.env.CLOUDFLARE_R2_ACCOUNT_ID) {
    throw new Error('CLOUDFLARE_R2_ACCOUNT_ID environment variable is required');
}

if (!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID) {
    throw new Error('CLOUDFLARE_R2_ACCESS_KEY_ID environment variable is required');
}

if (!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
    throw new Error('CLOUDFLARE_R2_SECRET_ACCESS_KEY environment variable is required');
}

if (!process.env.CLOUDFLARE_R2_BUCKET_NAME) {
    throw new Error('CLOUDFLARE_R2_BUCKET_NAME environment variable is required');
}

const ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;

/**
 * R2 S3-compatible client
 */
const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    },
});

/**
 * Upload a PDF file to R2
 * 
 * @param fileBuffer - PDF file buffer
 * @param fileName - File name (e.g., 'invoice-123.pdf')
 * @returns Public URL of the uploaded file
 */
export async function uploadPDF(
    fileBuffer: Buffer,
    fileName: string
): Promise<string> {
    const key = `invoices/${fileName}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: 'application/pdf',
        // Make the file publicly accessible
        // Note: You may want to configure bucket policies instead
    });

    await r2Client.send(command);

    // Generate public URL
    // For R2, you need to set up a custom domain or use R2's public bucket URL
    const publicUrl = `https://${BUCKET_NAME}.${ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

    return publicUrl;
}

/**
 * Generate a signed URL for temporary access to a PDF
 * 
 * @param fileName - File name
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Signed URL
 */
export async function getSignedPDFUrl(
    fileName: string,
    expiresIn: number = 3600
): Promise<string> {
    const key = `invoices/${fileName}`;

    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn });

    return signedUrl;
}

/**
 * Delete a PDF file from R2
 * 
 * @param fileName - File name
 */
export async function deletePDF(fileName: string): Promise<void> {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');

    const key = `invoices/${fileName}`;

    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    await r2Client.send(command);
}

export default {
    uploadPDF,
    getSignedPDFUrl,
    deletePDF,
};
