import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'

// import { generateThumbnail } from './lib/thumbnail'
// import { generateBlurFromThumbnail } from './lib/blurhash'
import { generateThumbnail } from '../scripts/lib/thumbnail.ts'
import { generateBlurFromThumbnail } from '../scripts/lib/blurhash.ts'

/* ========= 配置 ========= */

const BUCKET = process.env.R2_BUCKET!
const CDN_BASE = 'https://img.neuimay.com/'

const ORIGINAL_PREFIX = 'gallery/fullimage/'
const THUMB_PREFIX = 'gallery/thumbs/'

const OUTPUT_PATH = path.resolve('public/data/imageBase.json')

/* ========= 类型 ========= */

export interface ImageBase {
  id: string
  thumb: string
  full: string
  ratio: number
  blurDataURL: string
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
  const imageBaseMap: Record<string, ImageBase> = {}
  const imageOrder: string[] = []

  let token: string | undefined

  console.log('🚀 Start generating imageBase...')

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

      const fullUrl = `${CDN_BASE}${fullKey}`
      const thumbUrl = `${CDN_BASE}${thumbKey}`

      console.log(`📷 Processing: ${id}`)

      /* 1️⃣ 获取原图（算 ratio 用） */
      const fullBuffer = await getBufferFromR2(fullKey)
      const rotatedBuffer = await sharp(fullBuffer).rotate().toBuffer()
      const meta = await sharp(rotatedBuffer).metadata()

      if (!meta.width || !meta.height) continue

      /* 2️⃣ 检查 thumb 是否存在 */
      let thumbnailBuffer: Buffer

      const exists = await objectExists(thumbKey)

      if (exists) {
        console.log(`⏭ thumb exists`)
        thumbnailBuffer = await getBufferFromR2(thumbKey)
      } else {
        console.log(`🛠 generating thumbnail`)
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

      /* 3️⃣ 基于 thumb 生成 blur（始终生成） */
      const { blurDataURL } = await generateBlurFromThumbnail(
        thumbnailBuffer
      )

      /* 4️⃣ 记录 */
      imageBaseMap[id] = {
        id,
        thumb: thumbUrl,
        full: fullUrl,
        ratio: meta.width / meta.height,
        blurDataURL,
      }

      imageOrder.push(id)
    }

    token = res.NextContinuationToken
  } while (token)

  /* ========= 输出 JSON ========= */

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })

  fs.writeFileSync(
    OUTPUT_PATH,
    JSON.stringify({
      imageBaseMap,
      imageOrder,
    },null,2)
  )

  console.log(`✅ Generated ${imageOrder.length} images`)
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})