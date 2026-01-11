import { StravaActivity } from '@/types/strava'
import polyline from '@mapbox/polyline'

/**
 * Group polyline data by grid cells
 * @param data
 * @param gridSize 默认 200 x 200
 * @returns
 */
export default function groupPolyline(data: StravaActivity[], gridSize = 200) {
  const groups: { [key: string]: StravaActivity[] } = {}

  // Convert gridSize from kilometers to degrees (approximate)
  const gridSizeDegrees = gridSize / 111 // 1 degree ≈ 111 km

  data.forEach(activity => {
    if (!activity.map?.summary_polyline) return

    // Decode the polyline using @mapbox/polyline
    const points = polyline.decode(activity.map.summary_polyline)
    if (points.length === 0) return

    // Calculate center point of the activity
    const centerLat = points.reduce((sum, point) => sum + point[0], 0) / points.length
    const centerLng = points.reduce((sum, point) => sum + point[1], 0) / points.length

    // Calculate grid cell
    const gridX = Math.floor(centerLng / gridSizeDegrees)
    const gridY = Math.floor(centerLat / gridSizeDegrees)
    const gridKey = `${gridX},${gridY}`

    if (!groups[gridKey]) {
      groups[gridKey] = []
    }

    groups[gridKey].push(activity)
  })

  return Object.values(groups)
}
