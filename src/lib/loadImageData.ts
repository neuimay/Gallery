// import type { ImageBase, ImageMeta, ImageExif } from '@/types/image'

// export interface ImageData {
//   imageOrder: string[]
//   imageBaseMap: Record<string, ImageBase>
//   imageMetaMap: Record<string, ImageMeta>
//   imageExifMap: Record<string, ImageExif>
// }

// export async function loadImageData(): Promise<ImageData> {
//   const [baseRes, metaRes, exifRes] = await Promise.all([
//     fetch('/data/imageBase.json'),
//     fetch('/data/imageMeta.json'),
//     fetch('/data/imageExif.json'),
//   ])

//   if (!baseRes.ok || !metaRes.ok || !exifRes.ok) {
//     throw new Error('Failed to load gallery data')
//   }

//   const baseData = await baseRes.json()
//   const metaData = await metaRes.json()
//   const exifData = await exifRes.json()

//   return {
//     imageOrder: baseData.imageOrder,
//     imageBaseMap: baseData.imageBaseMap,
//     imageMetaMap: metaData.imageMetaMap,
//     imageExifMap: exifData.imageExifMap,
//   }
// }


import type { ImageBase, ImageMeta, ImageExif } from '@/types/image'

export interface ImageData {
  imageOrder: string[]
  imageBaseMap: Record<string, ImageBase>
  imageMetaMap: Record<string, ImageMeta>
  imageExifMap: Record<string, ImageExif>
}

export async function loadImageData(): Promise<ImageData> {
  const res = await fetch('/data/galleryData.json')

  if (!res.ok) {
    throw new Error('Failed to load gallery data')
  }

  const data = await res.json()
  const imageMap = data.imageMap

  const imageOrder = Object.keys(imageMap)

  const imageBaseMap: Record<string, ImageBase> = {}
  const imageMetaMap: Record<string, ImageMeta> = {}
  const imageExifMap: Record<string, ImageExif> = {}

  for (const id of imageOrder) {
    const img = imageMap[id]

    imageBaseMap[id] = {
      id: img.id,
      thumb: img.thumb,
      full: img.full,
      ratio: img.ratio,
      blurDataURL: img.blurDataURL,
    }

    imageMetaMap[id] = {
      id: img.id,
      width: img.width,
      height: img.height,
      sizeMB: img.sizeMB,
      format: img.format,
      tags: img.tags,
    }

    imageExifMap[id] = {
      id: img.id, 
      ...img.exif,
    }
  }

  return {
    imageOrder,
    imageBaseMap,
    imageMetaMap,
    imageExifMap,
  }
}