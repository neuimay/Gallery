import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MapView from '@/components/MapView'
import {back} from '@/assets/icons'
import PhotoPanel from '@/components/PhotoPanel'
import '../styles/map.css'
import GalleryViewer from '@/components/GalleryViewer'
import { loadImageData } from '@/lib/loadImageData'

interface MapPageProps {
  theme: 'light' | 'dark'
}

export default function MapPage({ theme }: MapPageProps) {
  const navigate = useNavigate()

  // Image Data
  const [imageBaseMap, setImageBaseMap] = useState<Record<string, any>>({})
  const [imageExifMap, setImageExifMap] = useState<Record<string, any>>({})
  const [dataLoaded, setDataLoaded] = useState(false)
  // if selected
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  // Viewer
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [viewerLoaded, setViewerLoaded] = useState(false)
  // Current Image 
  const currentId = selectedIds[viewerIndex]
  const currentImage = currentId ? imageBaseMap[currentId] : null

  // Load Data
  useEffect(() => {
    async function init() {
      const { imageBaseMap, imageExifMap } = await loadImageData()

      setImageBaseMap(imageBaseMap)
      setImageExifMap(imageExifMap)
      setDataLoaded(true)
    }

    init()
  }, [])

  // Viewer Transform
  const handlePrev = () => {
    setViewerIndex(prev =>
      prev === 0 ? selectedIds.length - 1 : prev - 1
    )
    setViewerLoaded(false)
  }

  const handleNext = () => {
    setViewerIndex(prev =>
      prev === selectedIds.length - 1 ? 0 : prev + 1
    )
    setViewerLoaded(false)
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (viewerOpen) {
          setViewerOpen(false)
          return
        }
    
        if (selectedIds.length > 0) {
          setSelectedIds([])
          return
        }
    
        navigate('/')
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [navigate, selectedIds, viewerOpen])

  // 🔹 数据未加载时不渲染
  if (!dataLoaded) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-root">
        Loading...
      </div>
    )
  }

  return (
    <div className="w-screen h-screen relative bg-root">
      {/* 左上角返回 */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-10
                   p-3 rounded-full
                   bg-black/60 text-white
                   backdrop-blur-xl
                   hover:bg-white/30
                   transition"
      >
        <img src={back} alt="back" className="w-5 h-5" />
      </button>

      {/* <MapView theme={theme} /> */}

      <div className="map-layout">
        {/* 地图 */}
        <MapView
          theme={theme}
          imageExifMap={imageExifMap}
          imageBaseMap={imageBaseMap}
          onClusterClick={(ids) => setSelectedIds(ids)}
          onPhotoClick={(id) => setSelectedIds([id])}
        />

        {/* 右侧面板 */}
        <PhotoPanel
          ids={selectedIds}
          imageBaseMap={imageBaseMap}
          theme={theme}
          onClose={() => setSelectedIds([])}
          onPhotoClick={(id, index) => {
            setViewerIndex(index)
            setViewerLoaded(false)
            setViewerOpen(true)
          }}
        />
      </div>

      {/* Viewer 覆盖层 */}
      {viewerOpen && currentImage && (
        <GalleryViewer
          image={currentImage}
          loaded={viewerLoaded}
          onLoaded={() => setViewerLoaded(true)}
          onClose={() => setViewerOpen(false)}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      )}
      
    </div>
  )
}