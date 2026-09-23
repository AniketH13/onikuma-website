import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../public/uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * POST /api/upload
 * Supports uploading single or multiple images as base64 data URLs:
 * { image: "data:image/png;base64,...", filename: "my-photo.png" }
 * or { images: [ { image: "data:...", filename: "..." }, ... ] }
 */
router.post('/', async (req, res) => {
  try {
    const { image, images, filename } = req.body;

    const itemsToSave = [];
    if (images && Array.isArray(images)) {
      itemsToSave.push(...images);
    } else if (image) {
      itemsToSave.push({ image, filename: filename || 'product.jpg' });
    }

    if (itemsToSave.length === 0) {
      return res.status(400).json({ success: false, message: 'No image data provided. Please select an image file to upload.' });
    }

    const savedUrls = [];
    for (let i = 0; i < itemsToSave.length; i++) {
      const item = itemsToSave[i];
      const dataUri = typeof item === 'string' ? item : (item.image || item.data);

      if (!dataUri) continue;

      // If it's already an existing HTTP or local uploads URL, keep as is
      if (dataUri.startsWith('http://') || dataUri.startsWith('https://') || dataUri.startsWith('/uploads/')) {
        savedUrls.push(dataUri);
        continue;
      }

      // Check base64 data url format
      const matches = dataUri.match(/^data:([A-Za-z0-9-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file format. Please upload valid image files (JPG, PNG, WEBP, GIF).'
        });
      }

      const mimeType = matches[1].toLowerCase();
      const base64Data = matches[2];
      
      let ext = 'jpg';
      if (mimeType.includes('png')) ext = 'png';
      else if (mimeType.includes('webp')) ext = 'webp';
      else if (mimeType.includes('gif')) ext = 'gif';
      else if (mimeType.includes('svg')) ext = 'svg';
      else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';

      const uniqueName = `onikuma-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filePath = path.join(uploadDir, uniqueName);

      const buffer = Buffer.from(base64Data, 'base64');
      await fs.promises.writeFile(filePath, buffer);

      savedUrls.push(`/uploads/${uniqueName}`);
    }

    return res.json({
      success: true,
      url: savedUrls[0] || '',
      urls: savedUrls,
      count: savedUrls.length,
      message: `${savedUrls.length} photo(s) uploaded successfully`
    });
  } catch (err) {
    console.error('Upload Error:', err);
    return res.status(500).json({ success: false, message: 'File upload failed: ' + err.message });
  }
});

export default router;
