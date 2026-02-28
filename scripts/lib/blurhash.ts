// lib/blurhash.ts
import sharp from 'sharp'
import { rgbaToThumbHash, thumbHashToDataURL } from 'thumbhash'
import { logger } from '../logger/index.ts' // 如果你有

export async function generateBlurFromThumbnail(
  thumbnailBuffer: Buffer
): Promise<{ blurDataURL: string }> {
  try {
    const { data, info } = await sharp(thumbnailBuffer)
      .resize(100, 100, { fit: 'inside' })
      .raw()
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true })

    const hash = rgbaToThumbHash(info.width, info.height, data)
    const blurDataURL = thumbHashToDataURL(hash)

    return { blurDataURL }
  } catch (err) {
    logger?.blurhash?.error('fail to generate blurhash', err)
    return { blurDataURL: '' }
  }
}
