// lib/thumbnail.ts
import sharp from 'sharp'

const THUMB_WIDTH = 600
const THUMB_QUALITY = 80

export async function generateThumbnail(
  imageBuffer: Buffer
): Promise<Buffer> {
  const sharpInstance = sharp(imageBuffer).rotate()

  const thumbnailBuffer = await sharpInstance
    .clone()
    .resize(THUMB_WIDTH, null, {
      withoutEnlargement: true,
    })
    .jpeg({ quality: THUMB_QUALITY })
    .toBuffer()

  return thumbnailBuffer
}

