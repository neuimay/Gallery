import type { ImageBase, ImageMeta, ImageExif } from '@/types/image'

export interface ImageData {
  imageOrder: string[]
  imageBaseMap: Record<string, ImageBase>
  imageMetaMap: Record<string, ImageMeta>
  imageExifMap: Record<string, ImageExif>
}

export async function loadImageData(): Promise<ImageData> {
  const [baseRes, metaRes, exifRes] = await Promise.all([
    fetch('/data/imageBase.json'),
    fetch('/data/imageMeta.json'),
    fetch('/data/imageExif.json'),
  ])

  if (!baseRes.ok || !metaRes.ok || !exifRes.ok) {
    throw new Error('Failed to load gallery data')
  }

  const baseData = await baseRes.json()
  const metaData = await metaRes.json()
  const exifData = await exifRes.json()

  return {
    imageOrder: baseData.imageOrder,
    imageBaseMap: baseData.imageBaseMap,
    imageMetaMap: metaData.imageMetaMap,
    imageExifMap: exifData.imageExifMap,
  }
}