export interface ImageBase {
    id: string
    thumb: string
    full: string
    ratio: number
    blurDataURL: string
  }

export type ImageMeta = {
  id: string
  width?: number
  height?: number
  sizeMB?: number
  format?: string
  tags?: string[]
}

export interface ImageExif {
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