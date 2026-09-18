export const SPLASH_CLOUD_TINTS = {
  jacarta: "bg-jacarta",
  meteorite: "bg-meteorite",
  "daisy-bush": "bg-daisy-bush",
  "biloba-flower": "bg-biloba-flower",
} as const

export type SplashCloudTint = keyof typeof SPLASH_CLOUD_TINTS

export type SplashCloudPuff = {
  id: string
  tint: SplashCloudTint
  left: number
  top: number
  width: number
  height: number
  rotate: number
}

export type SplashCurtainLayerId = "back" | "mid" | "front"

export type SplashCurtainLayer = {
  id: SplashCurtainLayerId
  widthClass: string
  delay: number
  travelVw: number
  puffs: SplashCloudPuff[]
}

type LayerConfig = {
  widthClass: string
  delay: number
  travelVw: number
  cols: number
  rows: number
  puffW: number
  puffH: number
  stepX: number
  stepY: number
  originX: number
  originY: number
  tints: SplashCloudTint[]
}

const LAYER_CONFIG: Record<SplashCurtainLayerId, LayerConfig> = {
  back: {
    widthClass: "w-[92%]",
    delay: 0,
    travelVw: 108,
    cols: 4,
    rows: 6,
    puffW: 88,
    puffH: 76,
    stepX: 22,
    stepY: 18,
    originX: -24,
    originY: -22,
    tints: ["meteorite", "daisy-bush", "jacarta"],
  },
  mid: {
    widthClass: "w-[84%]",
    delay: 0.05,
    travelVw: 122,
    cols: 5,
    rows: 7,
    puffW: 68,
    puffH: 56,
    stepX: 18,
    stepY: 15,
    originX: -14,
    originY: -18,
    tints: ["daisy-bush", "meteorite", "biloba-flower"],
  },
  front: {
    widthClass: "w-[76%]",
    delay: 0.1,
    travelVw: 136,
    cols: 5,
    rows: 8,
    puffW: 52,
    puffH: 44,
    stepX: 16,
    stepY: 13,
    originX: 2,
    originY: -14,
    tints: ["biloba-flower", "daisy-bush", "meteorite"],
  },
}

function blanketPuffs(layer: SplashCurtainLayerId): SplashCloudPuff[] {
  const tints = LAYER_CONFIG[layer].tints
  const blankets: Array<[number, number, number, number, SplashCloudTint, number]> =
    [
      [-36, -36, 150, 128, tints[0], -8],
      [-18, 2, 140, 120, tints[1], 7],
      [-34, 32, 148, 126, tints[0], -5],
      [-16, 62, 142, 124, tints[1], 6],
      [-38, 78, 146, 122, tints[0], 4],
    ]
  return blankets.map(([left, top, width, height, tint, rotate], i) => ({
    id: `${layer}-blanket-${i}`,
    tint,
    left,
    top,
    width,
    height,
    rotate,
  }))
}

function buildPuffs(layer: SplashCurtainLayerId): SplashCloudPuff[] {
  const cfg = LAYER_CONFIG[layer]
  const puffs = blanketPuffs(layer)

  for (let row = 0; row < cfg.rows; row++) {
    const stagger = (row % 2) * (cfg.stepX * 0.45)
    for (let col = 0; col < cfg.cols; col++) {
      const i = row * cfg.cols + col
      puffs.push({
        id: `${layer}-${i}`,
        tint: cfg.tints[i % cfg.tints.length],
        left: cfg.originX + col * cfg.stepX + stagger,
        top: cfg.originY + row * cfg.stepY,
        width: cfg.puffW,
        height: cfg.puffH,
        rotate: ((row * 5 + col * 9) % 17) - 8,
      })
    }
  }

  return puffs
}

export const SPLASH_CURTAIN_LAYERS: SplashCurtainLayer[] = (
  ["back", "mid", "front"] as const
).map((id) => ({
  id,
  widthClass: LAYER_CONFIG[id].widthClass,
  delay: LAYER_CONFIG[id].delay,
  travelVw: LAYER_CONFIG[id].travelVw,
  puffs: buildPuffs(id),
}))
