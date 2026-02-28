import type { ImageBase, ImageMeta } from '@/types/image'

interface Props {
  image: ImageBase
  imageMetaMap: Record<string, ImageMeta>
}

function displayName(id: string) {
  const parts = id.split('-')
  return parts[parts.length - 1]
}
export default function GalleryHover({ image, imageMetaMap }: Props) {
  const meta = imageMetaMap[image.id]
  if (!meta) return null

  return (
    <div
      className="
        absolute inset-0
        opacity-0
        group-hover:opacity-100
        transition-opacity duration-300
        flex items-end
      "
    >
      {/* 一体化渐变层 */}
      <div
        className="
          w-full
          p-4
          bg-gradient-to-t
          from-black/80
          via-black/40
          to-transparent
          text-white
        "
      >
        {/* 文件名 */}
        <div className="text-sm font-semibold">
          {displayName(meta.id)}
        </div>

        {/* 基本信息 */}
        <div className="text-xs text-white/70 mt-1 tracking-wide">
          {meta.format?.toUpperCase()}
          {meta.width && meta.height && (
            <> · {meta.width} × {meta.height}</>
          )}
          {meta.sizeMB && <> · {meta.sizeMB} MB</>}
        </div>

        {/* 标签 */}
        {meta.tags && meta.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {meta.tags.map(tag => (
              <span
                key={tag}
                className="
                  text-xs
                  px-3 py-1
                  rounded-full
                  bg-white/20
                "
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


