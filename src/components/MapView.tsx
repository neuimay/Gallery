import '../styles/gallery.css'
import { useEffect, useRef } from 'react'
import maplibregl, { Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { FeatureCollection, Point } from 'geojson'

interface MapViewProps {
  theme: 'light' | 'dark'
  imageExifMap: Record<string, any>
  imageBaseMap: Record<string, any>
  onClusterClick?: (ids: string[]) => void
  onPhotoClick?: (id: string) => void
}

export default function MapView({ theme, imageExifMap, imageBaseMap, onClusterClick, onPhotoClick }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapRef.current) return

    const map = new maplibregl.Map({
      container: mapRef.current,
      style:
        theme === 'dark'
          ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
          : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [105, 35],
      zoom: 4,
    })

    const markers = new Map<string, Marker>()

    const geojson: FeatureCollection<Point> = {
      type: 'FeatureCollection',
      features: Object.values(imageExifMap)
        .filter(img => img.gps)
        .map(img => ({
          type: 'Feature',
          properties: { id: img.id },
          geometry: {
            type: 'Point',
            coordinates: [
              img.gps!.longitude,
              img.gps!.latitude,
            ],
          },
        })),
    }

    console.log(geojson)

    map.on('load', () => {
      map.addSource('photos', {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 70,
      })

      // 👇 必须添加 helper layer
      map.addLayer({
        id: 'clusters-helper',
        type: 'circle',
        source: 'photos',
        filter: ['has', 'point_count'],
        paint: { 'circle-opacity': 0 },
      })

      map.addLayer({
        id: 'points-helper',
        type: 'circle',
        source: 'photos',
        filter: ['!', ['has', 'point_count']],
        paint: { 'circle-opacity': 0 },
      })

      updateMarkers()

      map.on('idle', updateMarkers)
    })

    function updateMarkers() {
      const features = map.queryRenderedFeatures({
        layers: ['clusters-helper', 'points-helper'],
      })

      console.log('visible features:', features.length)

      const visibleIds = new Set<string>()

      features.forEach((feature: any) => {
        const coords = feature.geometry.coordinates as [number, number]
        const props = feature.properties

        let markerId: string

        if (props.cluster) {
          markerId = `cluster-${props.cluster_id}`
        } else {
          markerId = `photo-${props.id}`
        }

        visibleIds.add(markerId)

        if (markers.has(markerId)) return

        const el = document.createElement('div')
        el.className = 'apple-marker'

        if (props.cluster) {
          createClusterContent(el, feature)
        } else {
          const base = imageBaseMap[props.id]
          el.style.backgroundImage = `url(${base.thumb})`

          el.onclick = () => {
            onPhotoClick?.(props.id)
          }
        }

        const marker = new maplibregl.Marker({
            element: el,
          })
            .setLngLat(coords)
            .addTo(map)

        markers.set(markerId, marker)
      })

      // 👇 删除不在视图内的 marker
      markers.forEach((marker, id) => {
        if (!visibleIds.has(id)) {
          marker.remove()
          markers.delete(id)
        }
      })
    }

    async function createClusterContent(el: HTMLDivElement, feature: any) {
      const clusterId = feature.properties.cluster_id
      const count = feature.properties.point_count
      const source = map.getSource('photos') as any

      const leaves = await source.getClusterLeaves(clusterId, 1, 0)
      const firstId = leaves[0].properties.id
      const base = imageBaseMap[firstId]

      el.style.backgroundImage = `url(${base.thumb})`

      const badge = document.createElement('div')
      badge.className = 'badge'
      badge.innerText = count
      el.appendChild(badge)

      el.onclick = async() => {
        const leaves = await source.getClusterLeaves(
          clusterId,
          Infinity,
          0
        )
        const ids = leaves.map((l: any) => l.properties.id)
        onClusterClick?.(ids)

      }
    }

    return () => {
      markers.forEach(m => m.remove())
      map.remove()
    }
  }, [theme])

  return <div ref={mapRef} className="w-full h-full" />
}