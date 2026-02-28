/**
 * 富士胶片风格 3D LUT
 * 32^3 LUT，256x256 布局（8x8 块，每块 32x32）
 * 参考：https://emanueleferonato.com/2018/06/09/playing-with-javascript-photos-and-3d-luts-lookup-tables/
 */

const LUT_SIZE = 32
const LUT_DIM = 256 // 8 * 32

/** 富士胶片色彩变换：lifted blacks、暖高光、阴影微绿、柔和对比 */
function fujiTransform(r: number, g: number, b: number): [number, number, number] {
  // S 曲线增强对比
  const sCurve = (x: number) => x * x * (3 - 2 * x)
  r = sCurve(r)
  g = sCurve(g)
  b = sCurve(b)

  // 提亮暗部（富士胶片 signature）
  const lift = 0.06
  r = r * (1 - lift) + lift
  g = g * (1 - lift) + lift
  b = b * (1 - lift) + lift

  // 高光偏暖，阴影微绿
  const lum = 0.299 * r + 0.587 * g + 0.114 * b
  if (lum > 0.5) {
    r *= 1.12
    g *= 1.04
    b *= 0.88
  } else {
    r *= 0.96
    g *= 1.1
    b *= 0.98
  }

  // 轻微褪色感
  const fade = 0.92
  const gray = (r + g + b) / 3
  r = gray + (r - gray) * fade
  g = gray + (g - gray) * fade
  b = gray + (b - gray) * fade

  return [
    Math.max(0, Math.min(1, r)),
    Math.max(0, Math.min(1, g)),
    Math.max(0, Math.min(1, b)),
  ]
}

/** 生成富士胶片 LUT ImageData（256x256） */
export function createFujiLUT(): ImageData {
  const data = new Uint8ClampedArray(LUT_DIM * LUT_DIM * 4)

  for (let b = 0; b < LUT_SIZE; b++) {
    for (let g = 0; g < LUT_SIZE; g++) {
      for (let r = 0; r < LUT_SIZE; r++) {
        const [rOut, gOut, bOut] = fujiTransform(
          r / (LUT_SIZE - 1),
          g / (LUT_SIZE - 1),
          b / (LUT_SIZE - 1)
        )

        const lutX = (b % 8) * LUT_SIZE + r
        const lutY = Math.floor(b / 8) * LUT_SIZE + g
        const idx = (lutY * LUT_DIM + lutX) * 4

        data[idx] = Math.round(rOut * 255)
        data[idx + 1] = Math.round(gOut * 255)
        data[idx + 2] = Math.round(bOut * 255)
        data[idx + 3] = 255
      }
    }
  }

  return new ImageData(new Uint8ClampedArray(data), LUT_DIM, LUT_DIM)
}

let cachedLUT: ImageData | null = null

export function getFujiLUT(): ImageData {
  if (!cachedLUT) cachedLUT = createFujiLUT()
  return cachedLUT
}

/**
 * 对 ImageData 应用 LUT
 */
export function applyLUT(imageData: ImageData, lutData: ImageData): void {
  const { data } = imageData
  const lut = lutData.data

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] >> 3
    const g = data[i + 1] >> 3
    const b = data[i + 2] >> 3

    const lutX = (b % 8) * LUT_SIZE + r
    const lutY = Math.floor(b / 8) * LUT_SIZE + g
    const lutIdx = (lutY * LUT_DIM + lutX) * 4

    data[i] = lut[lutIdx]
    data[i + 1] = lut[lutIdx + 1]
    data[i + 2] = lut[lutIdx + 2]
  }
}
