import React, { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue } from "motion/react"
import type { ImageBase,ImageMeta, ImageExif } from '@/types/image'
import { left, right, exit, info } from '@/assets/icons/index'
import InfoPanel from './InfoPanel'
import {useIsMobile} from "@/hooks/isMobile"

interface Props {
  image: ImageBase
  meta: ImageMeta
  exif: ImageExif
  loaded: boolean
  onLoaded: () => void
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export default function GalleryViewer({
  image,
  meta,
  exif,
  loaded,
  onLoaded,
  onClose,
  onPrev,
  onNext,
}: Props) {

  const touchStartX = useRef<number | null>(null)
  const touchStartDistance = useRef<number | null>(null)

  const [scale, setScale] = useState(1)
  const [showInfo, setShowInfo] = useState(false)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const PANEL_WIDTH = 340
  const isMobile = useIsMobile()

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
    if (e.touches.length === 2) {
      // 双指开始
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      touchStartDistance.current = Math.sqrt(dx * dx + dy * dy)
      return
    }
  
    if (scale === 1) {
      touchStartX.current = e.touches[0].clientX
    }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistance.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const newDistance = Math.sqrt(dx * dx + dy * dy)
  
      const scaleFactor = newDistance / touchStartDistance.current
  
      setScale(prev => {
        let next = prev * scaleFactor
        if (next < 1) next = 1
        if (next > 4) next = 4
        return next
      })
  
      touchStartDistance.current = newDistance
    }
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (scale > 1) return   // 🔥 放大时禁止切图
  
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
      onTouchMove={onTouchMove}
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


<div className="relative w-full h-full flex items-center justify-center px-16">
      <motion.div
        animate={{
  x: showInfo && !isMobile ? -170 : 0
}}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="absolute inset-0"
      >
      {/* ===== 中央内容区域 ===== */}
      <div
        className="
          relative
          w-full h-full
          flex items-center justify-center
          px-16
        "
        // className={`
        //   relative
        //   h-full
        //   flex items-center justify-center
        //   px-16
        //   transition-all duration-300
        //   ${showInfo ? "w-[calc(100%-340px)]" : "w-full"}
        // `}
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

      </motion.div>

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
          transition duration-300
        "
        style={{
          transform: showInfo && !isMobile ? `translateX(-${PANEL_WIDTH}px)` : "translateX(0)"
        }}
        onClick={e => {
          e.stopPropagation()
          onNext()
        }}
      >
        <img src={right} alt="next" className="w-3 h-3" />
      </button>

      {/* ===== Info按钮（桌面显示） ===== */}
      <button
        className="
          absolute top-6 right-16
          w-8 h-8
          flex items-center justify-center
          bg-white/10 hover:bg-white/40
          rounded-full backdrop-blur-xl
          transition duration-300
        "
        style={{
          transform: showInfo && !isMobile ? `translateX(-${PANEL_WIDTH}px)` : "translateX(0)"
        }}
        onClick={e => {
          e.stopPropagation()
          setShowInfo(v => !v)
        }}
      >
        <img src={info} alt="info" className="w-7 h-7" />
      </button>

      {/* ===== 关闭按钮 ===== */}
      <button
        className="
          absolute top-6 right-6
          w-8 h-8
          flex items-center justify-center
          bg-white/10 hover:bg-white/40
          rounded-full backdrop-blur-xl
          transition duration-300
        "
        style={{
          transform: showInfo && !isMobile ? `translateX(-${PANEL_WIDTH}px)` : "translateX(0)"
        }}
        onClick={e => {
          e.stopPropagation()
          onClose()
        }}
      >
        <img src={exit} alt="exit" className="w-4 h-4" />
      </button>


      {/* ===== Info面板 ===== */}
      <InfoPanel
        meta={meta}
        exif={exif}
        open={showInfo}
        onClose={() => setShowInfo(false)}
      />

    </div>
  )
}