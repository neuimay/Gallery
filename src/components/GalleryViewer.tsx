// import React, { useEffect, useRef, useState } from 'react'
// import type { ImageBase } from '@/types/image'
// import { left, right, exit } from '@/assets/icons/index'



// interface Props {
//   image: ImageBase
//   loaded: boolean
//   onLoaded: () => void
//   onClose: () => void
//   onPrev: () => void
//   onNext: () => void
// }




// export default function GalleryViewer({
//   image,
//   loaded,
//   onLoaded,
//   onClose,
//   onPrev,
//   onNext,
// }: Props) {
//   const touchStartX = useRef<number | null>(null)

//   const [scale, setScale] = useState(1)
//   //const [isZoomed, setIsZoomed] = useState(false)

//   const [position, setPosition] = useState({x: 0, y: 0})
//   const dragging = useRef(false)
//   const start = useRef({x:0, y:0})

//   const handleMouseDown = (e: React.MouseEvent) => {
//     if (scale === 1) return
  
//     e.preventDefault()
  
//     dragging.current = true
  
//     start.current = {
//       x: e.clientX - position.x,
//       y: e.clientY - position.y,
//     }
  
//     window.addEventListener('mousemove', handleMouseMove)
//     window.addEventListener('mouseup', handleMouseUp)
//   }

//   const handleMouseMove = (e: MouseEvent) => {
//     if (!dragging.current) return
  
//     setPosition({
//       x: e.clientX - start.current.x,
//       y: e.clientY - start.current.y,
//     })
//   }

//   const handleMouseUp = () => {
//     dragging.current = false
  
//     window.removeEventListener('mousemove', handleMouseMove)
//     window.removeEventListener('mouseup', handleMouseUp)
//   }


// const onDoubleClick = () => {
//   if (scale === 1) {
//     setScale(2)
//   } else {
//     setScale(1)
//     setPosition({ x: 0, y: 0 })
//   }
// }

//   const onWheel = (e: React.WheelEvent) => {
//     e.stopPropagation()
//     e.preventDefault()

//     const delta = -e.deltaY * 0.001
//     setScale(prev => {
//       let next = prev + delta


//       if (next <= 1) {
//         next = 1
//         setPosition({x:0, y:0})
//       }
//       if (next > 4) next = 4
//       return next
//     })
//   }

//   // ===== Touch =====
//   const onTouchStart = (e: React.TouchEvent) => {
//     touchStartX.current = e.touches[0].clientX
//   }

//   const onTouchEnd = (e: React.TouchEvent) => {
//     if (touchStartX.current === null) return
//     const dx = e.changedTouches[0].clientX - touchStartX.current
//     touchStartX.current = null

//     if (Math.abs(dx) < 50) return
//     dx > 0 ? onPrev() : onNext()
//   }

//   // ===== Keyboard =====
//   useEffect(() => {
//     const onKey = (e: KeyboardEvent) => {
//       if (e.key === 'Escape') onClose()
//       if (e.key === 'ArrowLeft') onPrev()
//       if (e.key === 'ArrowRight') onNext()
//     }

//     window.addEventListener('keydown', onKey)
//     document.body.style.overflow = 'hidden'

//     return () => {
//       window.removeEventListener('keydown', onKey)
//       document.body.style.overflow = ''
//     }
//   }, [onClose, onPrev, onNext])

//   // 当图片切换时，重置缩放状态
//   useEffect(() => {
//     setScale(1)
//     setPosition({x:0, y:0})
//   }, [image.id])


//   return (
//     <div
//     className="
//       fixed inset-0 z-50
//       flex items-center justify-center
//       overflow-hidden
//     "
//     onClick={onClose}
//     onTouchStart={onTouchStart}
//     onTouchEnd={onTouchEnd}
//   >
//     {/* ===== 当前图片作为背景 ===== */}
//     <div className="absolute inset-0 overflow-hidden">
//       <img
//         src={image.thumb}
//         className="
//           w-full h-full
//           object-cover
//           scale-110
//           blur-3xl
//           opacity-70
//           transition-all duration-700
//         "
//       />

//       {/* 暗色遮罩 */}
//       <div className="absolute inset-0 bg-black/20" />

//       {/* 顶部渐变提亮 */}
//       <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent" />

//       {/* 强 blur 层 */}
//       <div className="absolute inset-0 backdrop-blur-2xl" />
//     </div>

//     {/* 中央内容区域 */}
//     <div
//       className="
//         relative
//         w-full h-full
//         flex items-center justify-center
//         px-16
//       "
//       onClick={e => e.stopPropagation()}
//     >
//       <img
//         src={loaded ? image.full : image.thumb}
//         onLoad={onLoaded}
//         onWheel={onWheel}
//         onDoubleClick={onDoubleClick}
//         className="
//           max-h-[90vh]
//           max-w-[85vw]
//           object-contain
//           select-none
//           transition-transform duration-200 ease-out
//         "
//         onMouseDown={handleMouseDown}
//         draggable={false}
//               style={{
//         transform: `
//           translate(${position.x}px, ${position.y}px)
//           scale(${scale})
//         `,
//         cursor:
//           scale > 1
//             ? dragging.current
//               ? 'grabbing'
//               : 'grab'
//             : 'default',
//       }}
//       />
//     </div>

//     {/* 左按钮（相对整个 viewer） */}
//     <button
//       className="
//         absolute left-6 top-1/2 -translate-y-1/2
//         p-3
//         bg-white/10 hover:bg-white/40
//         rounded-full backdrop-blur-2xl
//         transition
//       "
//       onClick={e => {
//         e.stopPropagation()
//         onPrev()
//       }}
//     >
//       <img src={left} alt="prev" className="w-3 h-3" />
//     </button>

//     {/* 右按钮 */}
//     <button
//       className="
//         absolute right-6 top-1/2 -translate-y-1/2
//         p-3
//         bg-white/10 hover:bg-white/40
//         rounded-full backdrop-blur-xl
//         transition
//       "
//       onClick={e => {
//         e.stopPropagation()
//         onNext()
//       }}
//     >
//       <img src={right} alt="next" className="w-3 h-3" />
//     </button>

//     {/* 关闭按钮 */}
//     <button
//       className="
//         absolute top-6 right-6
//         w-8 h-8
//         flex items-center justify-center
//         bg-white/10 hover:bg-white/40
//         rounded-full backdrop-blur-xl
//         text-white text-lg
//         transition
//       "
//       onClick={e => {
//         e.stopPropagation()
//         onClose()
//       }}
//     >
//       <img src={exit} alt="exit" className="w-4 h-4" />
//     </button>
//   </div>

//   )
// }


import React, { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue } from "motion/react"
import type { ImageBase } from '@/types/image'
import { left, right, exit } from '@/assets/icons/index'

interface Props {
  image: ImageBase
  loaded: boolean
  onLoaded: () => void
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export default function GalleryViewer({
  image,
  loaded,
  onLoaded,
  onClose,
  onPrev,
  onNext,
}: Props) {

  const touchStartX = useRef<number | null>(null)

  const [scale, setScale] = useState(1)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // ===== 双击缩放 =====
  const onDoubleClick = () => {
    if (scale === 1) {
      setScale(2)
    } else {
      setScale(1)
      x.set(0)
      y.set(0)
    }
  }

  // ===== 滚轮缩放 =====
  const onWheel = (e: React.WheelEvent) => {
    e.stopPropagation()
    e.preventDefault()

    const delta = -e.deltaY * 0.001
    setScale(prev => {
      let next = prev + delta

      if (next <= 1) {
        next = 1
        x.set(0)
        y.set(0)
      }
      if (next > 4) next = 4
      return next
    })
  }

  // ===== Touch 左右滑动切图 =====
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null

    if (Math.abs(dx) < 50) return
    dx > 0 ? onPrev() : onNext()
  }

  // ===== Keyboard =====
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }

    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, onPrev, onNext])

  // ===== 切图重置 =====
  useEffect(() => {
    setScale(1)
    x.set(0)
    y.set(0)
  }, [image.id])

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        overflow-hidden
      "
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >

      {/* ===== 当前图片作为背景（完整保留） ===== */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={image.thumb}
          className="
            w-full h-full
            object-cover
            scale-110
            blur-3xl
            opacity-70
            transition-all duration-700
          "
        />

        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent" />
        <div className="absolute inset-0 backdrop-blur-2xl" />
      </div>

      {/* ===== 中央内容区域 ===== */}
      <div
        className="
          relative
          w-full h-full
          flex items-center justify-center
          px-16
        "
        onClick={e => e.stopPropagation()}
      >

        <motion.img
          src={loaded ? image.full : image.thumb}
          onLoad={onLoaded}
          onWheel={onWheel}
          onDoubleClick={onDoubleClick}
          drag={scale > 1}
          dragMomentum={false}
          style={{
            x,
            y,
            scale,
          }}
          className="
            max-h-[90vh]
            max-w-[85vw]
            object-contain
            select-none
            cursor-grab
            active:cursor-grabbing
          "
        />

      </div>

      {/* ===== 左按钮（桌面显示） ===== */}
      <button
        className="
          hidden md:flex
          absolute left-6 top-1/2 -translate-y-1/2
          p-3
          bg-white/10 hover:bg-white/40
          rounded-full backdrop-blur-2xl
          transition
        "
        onClick={e => {
          e.stopPropagation()
          onPrev()
        }}
      >
        <img src={left} alt="prev" className="w-3 h-3" />
      </button>

      {/* ===== 右按钮 ===== */}
      <button
        className="
          hidden md:flex
          absolute right-6 top-1/2 -translate-y-1/2
          p-3
          bg-white/10 hover:bg-white/40
          rounded-full backdrop-blur-xl
          transition
        "
        onClick={e => {
          e.stopPropagation()
          onNext()
        }}
      >
        <img src={right} alt="next" className="w-3 h-3" />
      </button>

      {/* ===== 关闭按钮 ===== */}
      <button
        className="
          absolute top-6 right-6
          w-8 h-8
          flex items-center justify-center
          bg-white/10 hover:bg-white/40
          rounded-full backdrop-blur-xl
          transition
        "
        onClick={e => {
          e.stopPropagation()
          onClose()
        }}
      >
        <img src={exit} alt="exit" className="w-4 h-4" />
      </button>

    </div>
  )
}