import { useState } from 'react'

type ProgressiveImageProps = {
  thumb: string
  full: string
  blurDataURL: string
  ratio: number
  alt?: string
}

export function ProgressiveImage({
  thumb,
  full,
  blurDataURL,
  ratio,
  alt = '',
}: ProgressiveImageProps) {
  const [thumbLoaded, setThumbLoaded] = useState(false)
  const [fullLoaded, setFullLoaded] = useState(false)

  return (
    <div
      className="
        relative w-full overflow-hidden
        bg-cover bg-center
        transition-[filter]
        duration-500
        ease-[cubic-bezier(0.22,1,0.36,1)]
      "
      style={{
        aspectRatio: ratio,
        backgroundImage: `url(${blurDataURL})`,
      }}
    >
      {/* thumbnail */}
      <img
        src={thumb}
        alt={alt}
        loading="lazy"
        onLoad={() => setThumbLoaded(true)}
        className={`
          absolute inset-0
          w-full h-full object-cover
          transition-opacity
          duration-300
          ease-[cubic-bezier(0.22,1,0.36,1)]
          ${thumbLoaded && !fullLoaded ? 'opacity-100' : 'opacity-0'}
        `}
      />

      {/* full image */}
      <img
        src={full}
        alt={alt}
        loading="lazy"
        onLoad={() => setFullLoaded(true)}
        className={`
          absolute inset-0
          w-full h-full object-cover
          transition-opacity
          duration-700
          ease-[cubic-bezier(0.22,1,0.36,1)]
          group-hover:scale-[1.045]
          transition-transform
          will-change-transform
          ${fullLoaded ? 'opacity-100' : 'opacity-0'}
        `}
      />
    </div>
  )
}
