export interface CityRoadsMapProps {
  summaryPolyline?: string
  summaryPolylines?: string[]
  showRoadNetwork?: boolean // 新增：控制是否显示路网
}

export interface Transform {
  scale: number
  translateX: number
  translateY: number
}

export interface Point {
  x: number
  y: number
}

export interface Bounds {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

export interface DecodedRoute {
  points: [number, number][]
  frequency: number
  intensity: number
}
