import polyline from '@mapbox/polyline'
import type { Bounds, DecodedRoute } from '../types'
import { ZOOM_SETTINGS } from '../constants'

export function decodeRoutes(polylines: string[]): DecodedRoute[] {
  // 创建一个 Map 来存储每个点的出现频率
  const pointFrequencyMap = new Map<string, number>()
  let maxFrequency = 1

  // 解码所有路线并记录点的频率
  polylines.forEach(line => {
    const points = polyline.decode(line)
    points.forEach(([lat, lng]) => {
      const key = `${lat.toFixed(5)},${lng.toFixed(5)}`
      const newFreq = (pointFrequencyMap.get(key) || 0) + 1
      pointFrequencyMap.set(key, newFreq)
      maxFrequency = Math.max(maxFrequency, newFreq)
    })
  })

  // 将路线转换为带频率和强度的点数组
  return polylines.map(line => {
    const points = polyline.decode(line)
    const frequency = Math.max(
      ...points.map(
        ([lat, lng]) => pointFrequencyMap.get(`${lat.toFixed(5)},${lng.toFixed(5)}`) || 1
      )
    )

    // 计算强度值 (0-1 范围)
    const intensity = maxFrequency === 1 ? 0 : (frequency - 1) / (maxFrequency - 1)

    return {
      points,
      frequency,
      intensity,
    }
  })
}

export function getBoundsForRoutes(routes: DecodedRoute[]): Bounds {
  const allPoints = routes.flatMap(route => route.points)
  return allPoints.reduce(
    (bounds, [lat, lng]) => ({
      minLat: Math.min(bounds.minLat, lat),
      maxLat: Math.max(bounds.maxLat, lat),
      minLng: Math.min(bounds.minLng, lng),
      maxLng: Math.max(bounds.maxLng, lng),
    }),
    {
      minLat: Infinity,
      maxLat: -Infinity,
      minLng: Infinity,
      maxLng: -Infinity,
    }
  )
}

export function getExpandedBounds(bounds: Bounds, aspectRatio: number): Bounds {
  const latSpan = bounds.maxLat - bounds.minLat
  const lngSpan = bounds.maxLng - bounds.minLng

  // 根据宽高比调整边界
  const center = {
    lat: (bounds.minLat + bounds.maxLat) / 2,
    lng: (bounds.minLng + bounds.maxLng) / 2,
  }

  let paddedLatSpan = latSpan
  let paddedLngSpan = lngSpan
  // 确保边界的宽高比与容器相匹配
  const currentAspectRatio = paddedLngSpan / paddedLatSpan
  if (currentAspectRatio > aspectRatio) {
    // 太宽了，需要增加高度
    paddedLatSpan = paddedLngSpan / aspectRatio
  } else {
    // 太高了，需要增加宽度
    paddedLngSpan = paddedLatSpan * aspectRatio
  }

  paddedLatSpan *= 1 + ZOOM_SETTINGS.expandedPadding * 2
  paddedLngSpan *= 1 + ZOOM_SETTINGS.expandedPadding * 2

  return {
    minLat: center.lat - paddedLatSpan / 2,
    maxLat: center.lat + paddedLatSpan / 2,
    minLng: center.lng - paddedLngSpan / 2,
    maxLng: center.lng + paddedLngSpan / 2,
  }
}
