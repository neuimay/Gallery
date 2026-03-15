import { useEffect, useState } from 'react'
import GalleryViewer from './GalleryViewer'
import GalleryHover from './GalleryHover'
import { ProgressiveImage } from './ProgressiveImage'
import { loadImageData } from '@/lib/loadImageData'
import type { ImageBase, ImageMeta, ImageExif } from '@/types/image'

export default function Gallery() {
  const [imageBaseMap, setImageBaseMap] =
  useState<Record<string, ImageBase>>({})

  const [imageMetaMap, setImageMetaMap] =
  useState<Record<string, ImageMeta>>({})

  const [imageExifMap, setImageExifMap] =
  useState<Record<string, ImageExif>>({})

  const [imageOrder, setImageOrder] =
    useState<string[]>([])

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadImageData().then((data) => {
      setImageBaseMap(data.imageBaseMap)
      setImageMetaMap(data.imageMetaMap)
      setImageExifMap(data.imageExifMap) 
      setImageOrder(data.imageOrder)
      setLoading(false)
    })
  }, [])

  const [activeId, setActiveId] = useState<string | null>(null)
  const [viewerLoaded, setViewerLoaded] = useState(false)

  const active = activeId ? imageBaseMap[activeId] : null
  const meta = activeId ? imageMetaMap[activeId] : null
  const exif = activeId ? imageExifMap[activeId] : null

  const prev = () => {
    if (!activeId) return
    const idx = imageOrder.indexOf(activeId)
    if (idx > 0) setActiveId(imageOrder[idx - 1])
  }

  const next = () => {
    if (!activeId) return
    const idx = imageOrder.indexOf(activeId)
    if (idx < imageOrder.length - 1) setActiveId(imageOrder[idx + 1])
  }

  if (loading) return null

  return (
    <>
      <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-[5px] p-[5px]">
        {imageOrder.map(id => {
          const img = imageBaseMap[id]

          return (
            <div
              key={id}
              className="group relative mb-[5px] break-inside-avoid overflow-hidden bg-[#111] cursor-pointer"
              style={{ aspectRatio: img.ratio }}
              onClick={() => setActiveId(id)}
            >
              <ProgressiveImage
                thumb={img.thumb}
                full={img.full}
                blurDataURL={img.blurDataURL}
                ratio={img.ratio}
                alt={img.id}
              />

              <GalleryHover image={img} imageMetaMap={imageMetaMap} />
            </div>
          )
        })}
      </div>

      {active && meta && exif &&  (
        <GalleryViewer
          image={active}
          meta={meta}
          exif={exif}
          loaded={viewerLoaded}
          onLoaded={() => setViewerLoaded(true)}
          onClose={() => {
            setActiveId(null)
            setViewerLoaded(false)
          }}
          onPrev={() => {
            setViewerLoaded(false)
            prev()
          }}
          onNext={() => {
            setViewerLoaded(false)
            next()
          }}
        />
      )}

    </>
  )
}



