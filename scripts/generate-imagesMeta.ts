import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import {
  S3Client,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'

export type ImageMeta = {
  id: string
  width?: number
  height?: number
  sizeMB?: number
  format?: string
  tags?: string[]
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

function bytesToMB(bytes: number) {
  return Number((bytes / 1024 / 1024).toFixed(2))
}

function buildId(key: string) {
  return key
    .replace(ORIGINAL_PREFIX, '')
    .replace(/\//g, '-')
    .replace(/\.(jpe?g|png|webp)$/i, '')
}

function autoTagsFromId(id: string): string[] {
  const [region] = id.split('-')
  return region ? [region] : []
}

async function main() {
  const metaMap: Record<string, ImageMeta> = {}
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

      console.log(`📸 meta: ${id}`)

      const imgRes = await fetch(fullUrl)
      const buffer = Buffer.from(await imgRes.arrayBuffer())

      const rotatedBuffer = await sharp(buffer)
        .rotate()
        .toBuffer()

      const meta = await sharp(rotatedBuffer).metadata()

      metaMap[id] = {
        id,
        width: meta.width,
        height: meta.height,
        format: meta.format,
        sizeMB: obj.Size ? bytesToMB(obj.Size) : undefined,
        tags: autoTagsFromId(id),
      }
    }

    token = res.NextContinuationToken
  } while (token)

  // ⭐ 改成 JSON 输出
  const output = {
    imageMetaMap: metaMap,
  }

  fs.writeFileSync(
    path.resolve('public/data/imageMeta.json'),
    JSON.stringify(output, null, 2)
  )

  console.log(`✅ imageMeta.json generated: ${Object.keys(metaMap).length}`)
}

main()