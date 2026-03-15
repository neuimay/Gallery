import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import exifr from 'exifr'

import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'

import { generateThumbnail } from '../scripts/lib/thumbnail.ts'
import { generateBlurFromThumbnail } from '../scripts/lib/blurhash.ts'

/* ========= 配置 ========= */

const BUCKET = process.env.R2_BUCKET!
const CDN_BASE = 'https://img.neuimay.com/'

const ORIGINAL_PREFIX = 'gallery/fullimage/'
const THUMB_PREFIX = 'gallery/thumbs/'

const OUTPUT_PATH = path.resolve('public/data/galleryData.json')

/* ========= 类型 ========= */

interface GalleryImage {
  id: string
  thumb: string
  full: string
  ratio: number
  blurDataURL: string

  width?: number
  height?: number
  sizeMB?: number
  format?: string
  tags?: string[]

  exif?: {
    make?: string
    model?: string
    dateTimeOriginal?: string
    exposure?: {
      iso?: number
      fNumber?: number
      exposureTime?: number
      focalLength?: number
      focalLength35mm?: number
    }
    gps?: {
      latitude: number
      longitude: number
      altitude?: number
    }
  }
}

/* ========= R2 Client ========= */

const client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_KEY!,
  },
})

/* ========= 工具 ========= */

function buildId(key: string) {
  return key
    .replace(ORIGINAL_PREFIX, '')
    .replace(/\//g, '-')
    .replace(/\.(jpe?g|png|webp)$/i, '')
}

function buildThumbKey(fullKey: string) {
  return fullKey.replace(ORIGINAL_PREFIX, THUMB_PREFIX)
}

function bytesToMB(bytes: number) {
  return Number((bytes / 1024 / 1024).toFixed(2))
}

function autoTagsFromId(id: string): string[] {
  const [region] = id.split('-')
  return region ? [region] : []
}

async function objectExists(key: string) {
  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    )
    return true
  } catch {
    return false
  }
}

async function getBufferFromR2(key: string): Promise<Buffer> {
  const obj = await client.send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  )

  const chunks: Uint8Array[] = []
  const stream = obj.Body as any

  for await (const chunk of stream) {
    chunks.push(chunk)
  }

  return Buffer.concat(chunks)
}

/* ========= 主逻辑 ========= */

async function main() {
  const imageMap: Record<string, GalleryImage> = {}
  const imageOrder: string[] = []

  let token: string | undefined

  console.log('🚀 Generating galleryData...')

  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: ORIGINAL_PREFIX,
        ContinuationToken: token,
      })
    )

    for (const obj of res.Contents ?? []) {
      if (!obj.Key) continue
      if (!obj.Key.match(/\.(jpe?g|png|webp)$/i)) continue

      const fullKey = obj.Key
      const thumbKey = buildThumbKey(fullKey)
      const id = buildId(fullKey)

      console.log(`📷 Processing: ${id}`)

      const fullUrl = `${CDN_BASE}${fullKey}`
      const thumbUrl = `${CDN_BASE}${thumbKey}`

      /* 1️⃣ 获取原图（一次） */
      const fullBuffer = await getBufferFromR2(fullKey)

      /* 2️⃣ sharp 统一 decode + rotate */
      const metadata = await sharp(fullBuffer).metadata()

      let width = metadata.width!
      let height = metadata.height!

      if (metadata.orientation && metadata.orientation >= 5) {
        ;[width, height] = [height, width]
      }

      const ratio = width / height

      /* 3️⃣ 缩略图 */
      let thumbnailBuffer: Buffer

      const exists = await objectExists(thumbKey)

      if (exists) {
        thumbnailBuffer = await getBufferFromR2(thumbKey)
      } else {
        thumbnailBuffer = await generateThumbnail(fullBuffer)

        await client.send(
          new PutObjectCommand({
            Bucket: BUCKET,
            Key: thumbKey,
            Body: thumbnailBuffer,
            ContentType: 'image/jpeg',
            CacheControl: 'public, max-age=31536000, immutable',
          })
        )
      }

      /* 4️⃣ blur */
      const { blurDataURL } = await generateBlurFromThumbnail(
        thumbnailBuffer
      )

      /* 5️⃣ EXIF */
      let exifData: GalleryImage['exif']

      try {
        const exif = await exifr.parse(fullBuffer, {
          gps: true,
          translateValues: true,
        })

        if (exif) {
          exifData = {
            make: exif.Make,
            model: exif.Model,
            dateTimeOriginal: exif.DateTimeOriginal
              ? new Date(exif.DateTimeOriginal).toISOString()
              : undefined,
            exposure: {
              iso: exif.ISO,
              fNumber: exif.FNumber,
              exposureTime: exif.ExposureTime,
              focalLength: exif.FocalLength,
              focalLength35mm: exif.FocalLengthIn35mmFormat,
            },
            gps:
              exif.latitude && exif.longitude
                ? {
                    latitude: exif.latitude,
                    longitude: exif.longitude,
                    altitude: exif.GPSAltitude,
                  }
                : undefined,
          }
        }
      } catch {
        console.warn(`⚠️ EXIF failed: ${id}`)
      }

      /* 6️⃣ 记录 */
      imageMap[id] = {
        id,
        thumb: thumbUrl,
        full: fullUrl,
        ratio,
        blurDataURL,

        width,
        height,
        sizeMB: obj.Size ? bytesToMB(obj.Size) : undefined,
        format: metadata.format,
        tags: autoTagsFromId(id),

        exif: exifData,
      }

      imageOrder.push(id)
    }

    token = res.NextContinuationToken
  } while (token)

  /* ========= 输出 ========= */

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })

  fs.writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(
      {
        imageMap,
        imageOrder,
      },
      null,
      2
    )
  )

  console.log(`✅ Done. ${imageOrder.length} images processed.`)
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})