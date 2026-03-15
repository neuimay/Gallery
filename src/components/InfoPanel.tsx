import {motion} from "motion/react"
import type { ImageMeta, ImageExif } from '@/types/image'
import {useIsMobile} from "@/hooks/isMobile"
import { useState } from "react"

interface Props{
    meta: ImageMeta
    exif: ImageExif
    open: boolean
    onClose: () => void
}

const zoneLabel: Record<string, { tz: string; cities: string[] }> = {
  "UTC+9": {
    tz: "Asia/Tokyo",
    cities: ["Tokyo", "Nagoya", "Kyoto", "Kanayama"],
  },
  "UTC+8": {
    tz: "Asia/Shanghai",
    cities: ["Beijing", "Shanghai", "HongKong", "Anhui", "Jinan", "Hometown", "Nantong", "Hangzhou"],
  },
  "UTC+3": {
    tz: "Asia/Qatar",
    cities: ["Doha"],
  },
  "UTC+0": {
    tz: "Europe/London",
    cities: ["London", "Leeds", "Dublin", "Galway", "Westport"],
  },
}

export default function InfoPanel({ meta, exif, open, onClose }: Props) {
    const city = displayLocation(meta.id)
    const { zone, tz } = getTimezone(city)

    let date = ""
    let time = ""

    if (exif.dateTimeOriginal) {
    const result = getCameraTime(exif.dateTimeOriginal)
    date = result.date
    time = result.time
    }

    const isMobile = useIsMobile()
    
    return (
    <motion.div

    key={isMobile ? "mobile" : "desktop"}
    initial={false}

    animate={
        isMobile
        ? { y: open ? 0 : "100%" }
        : { x: open ? 0 : "100%" }
    }
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className={`
        fixed 
        ${isMobile
            ? "bottom-0 left-0 w-full h-[55vh]"
            : "top-0 right-0 w-[320px] h-full"
        }

        p-6
        overflow-y-auto no-scrollbar
        text-white

        backdrop-blur-3xl
        bg-black/40
        bg-gradient-to-b from-white/5 via-transparent to-black/40

        ${isMobile ? "border-t border-white/10" : "border-l border-white/10"}
        shadow-[0_0_60px_rgba(0,0,0,0.6)]
        `}


      onClick={e => e.stopPropagation()}
    >

        

        {/* glass highlight */}
    <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-transparent opacity-40"/>
    </div>
    
    <div className="relative">
        {isMobile && (
    <div className="flex justify-center mb-4">
        <div className="w-10 h-1 rounded-full bg-white/30"/>
    </div>
    )}
      <h2 className="text-lg font-medium mb-6">
        Image Info
      </h2>

      {/* 基本信息 */}
      <Section title="File">
        <InfoRow label="Name">
          {displayName(meta.id)}
        </InfoRow>

        <InfoRow label="Resolution">
          {meta.width} × {meta.height}
        </InfoRow>

        <InfoRow label="Format">
          {meta.format}
        </InfoRow>

        <InfoRow label="Size">
          {meta.sizeMB} MB
        </InfoRow>

        <InfoRow label="Date">
        {date}
        </InfoRow>

        <InfoRow label="Time">
        {time}
        </InfoRow>

        <InfoRow label="Location">
          {city}
        </InfoRow>

        <InfoRow label="Tags">
        <div className="flex flex-wrap gap-1 justify-end">
            {meta.tags?.map(tag => (
            <span
                key={tag}
                className="
                px-2 py-[2px]
                text-xs
                bg-white/10
                border border-white/10
                rounded-full
                "
            >
                {tag}
            </span>
            ))}
        </div>
        </InfoRow>
      </Section>

      {/* EXIF */}
      {exif && (
        <Section title="Camera">

          <InfoRow label="Camera">
            {exif.make} {exif.model}
          </InfoRow>

            <InfoRow label="Zone">{zone === "UTC+0" ? "UTC" : zone}</InfoRow>

          <InfoRow label="ISO">
            {exif.exposure?.iso}
          </InfoRow>

          <InfoRow label="Aperture">
            f/{exif.exposure?.fNumber}
          </InfoRow>

          <InfoRow label="Shutter">
            {exif.exposure?.exposureTime}s
          </InfoRow>

          <InfoRow label="Focal Length">
            {exif.exposure?.focalLength} mm
          </InfoRow>

        </Section>
      )}

      </div>
    </motion.div>
  )
}

function Section({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-8">
      <div className="text-xs text-white/40 mb-3">
        {title}
      </div>
      <div className="space-y-2 text-sm">
        {children}
      </div>
    </div>
  )
}

function InfoRow({
  label,
  children
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex justify-between items-center gap-4">

      <span className="text-white/50 text-sm tracking-wide">
        {label}
      </span>

      <span className="text-right text-white/90 font-medium">
        {children}
      </span>

    </div>
  )
}

function displayName(id: string) {
  const parts = id.split('-')
  return parts[parts.length - 1]
}
function displayLocation(id: string) {
  const parts = id.split('-')
  return parts.slice(0, -1).join('-')
}

// function formatDate(date?: string) {
//   if (!date) return "—"

//   const d = new Date(date)

//   return d.toLocaleDateString("en-US", {
//     timeZone: "UTC",
//     year: "numeric",
//     month: "short",
//     day: "numeric"
//   })
// }

// function formatTime(date?: string) {
//   if (!date) return "—"

//   const d = new Date(date)

//   return d.toLocaleTimeString("en-GB", {
//     timeZone: "UTC",
//     hour: "2-digit",
//     minute: "2-digit",
//     second: "2-digit",
//     hour12: false
//   })
// }

// function formatZone() {
//   return "UTC"
// }



/* Calculate timezone from location (simplified) */
function getTimezone(city: string) {
  for (const [zone, data] of Object.entries(zoneLabel)) {
    if (data.cities.includes(city)) {
      return { zone, tz: data.tz }
    }
  }
  return { zone: "UTC", tz: "UTC" }
}
function getLocalTime(iso: string, tz: string) {
  const date = new Date(iso)

  return {
    date: date.toLocaleDateString("en-US", {
      timeZone: tz,
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-US", {
      timeZone: tz,
      hour12: false,
    }),
  }
}

function getCameraTime(iso: string) {
  const date = new Date(iso)

  return {
    date: date.toLocaleDateString("en-US", {
      timeZone: "Asia/Tokyo",
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-US", {
      timeZone: "Asia/Tokyo",
      hour12: false,
    }),
  }
}