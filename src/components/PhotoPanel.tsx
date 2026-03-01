import { useEffect, useState } from 'react'
import { exit } from '@/assets/icons/index'

interface PhotoPanelProps {
  ids: string[]
  imageBaseMap: Record<string, any>
  theme: 'light' | 'dark'
  onClose: () => void
  onPhotoClick: (id: string, index: number) => void
}

export default function PhotoPanel({
  ids,
  imageBaseMap,
  theme,
  onClose,
  onPhotoClick,
}: PhotoPanelProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (ids.length) {
      setVisible(true)
    } else {
      setVisible(false)
    }
  }, [ids])

  if (!ids.length) return null

  return (
    <div
      // className={`
      //   fixed right-0 top-0 bottom-0
      //   w-[420px]
      //   transition-all duration-300 ease-out
      //   ${visible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}
      // `}

      className={`
        fixed z-50
        transition-all duration-300 ease-out
    
        /* 移动端默认 */
        left-0 right-0 bottom-0
        h-[65vh]
        rounded-t-3xl
        ${visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
    
        /* 桌面端覆盖移动端 */
        md:left-auto
        md:right-0 md:top-0 md:bottom-0
        md:h-auto
        md:w-[420px]
        md:rounded-none
        md:translate-y-0
        ${visible ? 'md:translate-x-0 md:opacity-100' : 'md:translate-x-10 md:opacity-0'}
      `}
    >
      <div
        className={`
            h-full md:h-full
            flex flex-col
            transition-colors duration-300

            ${
            theme === 'dark'
                ? `
                bg-white/40
                backdrop-blur-2xl
                border-l border-white/40
                `
                : `
                bg-black/40
                backdrop-blur-2xl
                border-l border-white/10
                `
            }

            shadow-[-20px_0_60px_rgba(0,0,0,0.25)]
        `}
        >
        {/* Header */}
        <div className={`
            px-6 py-6
            flex items-center justify-between
            ${
                theme === 'dark'
                ? 'text-black border-b border-black/5'
                : 'text-white border-b border-white/10'
            }
            `}>
          <div>
            {/* <div className="text-sm ">
              Location
            </div> */}
            <div className="text-lg font-semibold">
              {ids.length} Photos
            </div>
          </div>

          <button
            onClick={onClose}
            className="
              w-8 h-8
              flex items-center justify-center
              rounded-full
              bg-white/40
              hover:bg-white/70
              transition
            "
          >
            <img src={exit} alt="exit" className="w-3 h-3" />
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-4 photo-scroll">
          <div className="grid grid-cols-2 gap-2">
            {ids.map((id, index) => {
              const base = imageBaseMap[id]
              if (!base) return null

              return (
                <div
                    key={id}
                    className="
                        relative
                        overflow-hidden
                        shadow-sm
                        cursor-pointer
                        group
                    "
                    onClick={() => onPhotoClick(id, index)}
                    >
                    <img
                        src={base.thumb}
                        className="
                        w-full
                        h-full
                        object-cover
                        transition-transform duration-300 ease-out
                        group-hover:scale-110
                        "
                    />
                    </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}