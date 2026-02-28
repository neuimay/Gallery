import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import exifr from 'exifr'
import sharp from 'sharp'
import {
  S3Client,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'

type ImageExif = {
  id: string
  make?: string
  model?: string
  dateTimeOriginal?: string
  width?: number
  height?: number
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

const BUCKET = process.env.R2_BUCKET!
const ORIGINAL_PREFIX = 'gallery/fullimage/'
const CDN_BASE = 'https://img.neuimay.com/'

const client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_KEY!,
  },
})

function buildId(key: string) {
  return key
    .replace(ORIGINAL_PREFIX, '')
    .replace(/\//g, '-')
    .replace(/\.(jpe?g|png|webp)$/i, '')
}

async function main() {
  const exifMap: Record<string, ImageExif> = {}
  let token: string | undefined

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
      if (obj.Key.endsWith('/')) continue
      if (!obj.Key.match(/\.(jpe?g|png|webp)$/i)) continue

      const fullKey = obj.Key
      const fullUrl = `${CDN_BASE}${fullKey}`
      const id = buildId(fullKey)

      console.log(`📷 EXIF: ${id}`)

      try {
        const res = await fetch(fullUrl)
        const buffer = Buffer.from(await res.arrayBuffer())

        // 读取尺寸 + orientation
        const meta = await sharp(buffer).metadata()

        let width = meta.width
        let height = meta.height

        if (meta.orientation && [5, 6, 7, 8].includes(meta.orientation)) {
          if (width && height) {
            ;[width, height] = [height, width]
          }
        }

        // 读取 EXIF
        const exif = await exifr.parse(buffer, {
          gps: true,
          translateValues: true,
        })

        if (!exif) continue

        exifMap[id] = {
          id,
          make: exif.Make,
          model: exif.Model,
          dateTimeOriginal: exif.DateTimeOriginal
            ? new Date(exif.DateTimeOriginal).toISOString()
            : undefined,
          width,
          height,
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
      } catch (err) {
        console.warn(`⚠️ EXIF failed: ${id}`)
      }
    }

    token = res.NextContinuationToken
  } while (token)

  // ⭐ 改为 JSON 输出
  const output = {
    imageExifMap: exifMap,
  }

  fs.writeFileSync(
    path.resolve('public/data/imageExif.json'),
    JSON.stringify(output, null, 2)
  )

  console.log(`✅ imageExif.json generated: ${Object.keys(exifMap).length}`)
}

main()