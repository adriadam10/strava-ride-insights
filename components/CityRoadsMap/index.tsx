import { useEffect, useRef, useState, useCallback } from 'react'
import { fetchRoadNetwork, filterRoadsByZoom } from './utils/overpass'
import * as d3 from 'd3'
import { decodeRoutes, getBoundsForRoutes, getExpandedBounds } from './utils/bounds'
import type { CityRoadsMapProps, DecodedRoute } from './types'
import { MAP_BACKGROUND, ROAD_STYLE, ZOOM_SETTINGS, ROUTE_STYLE } from './constants'

interface Transform {
  k: number
  x: number
  y: number
}

export function CityRoadsMap({
  summaryPolyline,
  summaryPolylines,
  showRoadNetwork = true, // 默认显示路网
}: CityRoadsMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [roadNetwork, setRoadNetwork] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [transform, setTransform] = useState<Transform>({ k: ZOOM_SETTINGS.initialZoom, x: 0, y: 0 })

  const routes = useRef<DecodedRoute[]>(
    decodeRoutes(summaryPolylines || (summaryPolyline ? [summaryPolyline] : []))
  )

  const boundsRef = useRef(null)

  const fetchRoads = useCallback(async (bounds: any) => {
    if (!showRoadNetwork) return // 如果不显示路网，直接返回
    
    try {
      setIsLoading(true)
      const roads = await fetchRoadNetwork(bounds)
      setRoadNetwork(roads)
    } catch (error) {
      console.error('Failed to fetch road network:', error)
    } finally {
      setIsLoading(false)
    }
  }, [showRoadNetwork])

  useEffect(() => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    routes.current = decodeRoutes(summaryPolylines || (summaryPolyline ? [summaryPolyline] : []))
    boundsRef.current = getExpandedBounds(getBoundsForRoutes(routes.current), rect.width / rect.height)
    setRoadNetwork([])
    if (showRoadNetwork) {
      fetchRoads(boundsRef.current)
    }
  }, [summaryPolyline, summaryPolylines, showRoadNetwork, fetchRoads])

  const renderMap = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const pixelRatio = window.devicePixelRatio || 1
    canvas.width = rect.width * pixelRatio
    canvas.height = rect.height * pixelRatio
    ctx.scale(pixelRatio, pixelRatio)

    // Clear canvas
    ctx.fillStyle = MAP_BACKGROUND
    ctx.fillRect(0, 0, rect.width, rect.height)

    // Convert route points to GeoJSON format (swap lat/lng)
    const routeCoordinates = routes.current.flatMap(route =>
      route.points.map(([lat, lng]) => [lng, lat])
    )

    const bounds = boundsRef.current

    // Create projection with padding
    const projection = d3.geoMercator()
      .center([(bounds.minLng + bounds.maxLng) / 2, (bounds.minLat + bounds.maxLat) / 2])
      .fitExtent([
        [ZOOM_SETTINGS.initialExtendPadding, ZOOM_SETTINGS.initialExtendPadding],
        [rect.width - ZOOM_SETTINGS.initialExtendPadding, rect.height - ZOOM_SETTINGS.initialExtendPadding]
      ], {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routeCoordinates
        }
      })

    // Apply zoom transform
    ctx.save()
    ctx.translate(transform.x, transform.y)
    ctx.scale(transform.k, transform.k)

    // Create path generator for canvas
    const path = d3.geoPath().projection(projection).context(ctx)

    // 只在启用时绘制路网
    if (showRoadNetwork && roadNetwork.length > 0) {
      // 根据缩放级别过滤道路
      const filteredRoads = filterRoadsByZoom(roadNetwork, transform.k)

      // Draw roads with dynamic filtering
      ctx.beginPath()
      ctx.strokeStyle = ROAD_STYLE.color
      ctx.lineWidth = ROAD_STYLE.width / transform.k
      ctx.globalAlpha = ROAD_STYLE.opacity
      filteredRoads.forEach(road => {
        const feature = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: road.coordinates.map(([lat, lng]: [number, number]) => [lng, lat])
          }
        }
        path(feature as any)
      })
      ctx.stroke()
      ctx.globalAlpha = 1.0 // 恢复默认透明度
    }

    const isOnlyOneRoute = routes.current.length === 1

    // Draw routes
    routes.current.forEach(route => {
      const routeFeature = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: route.points.map(([lat, lng]) => [lng, lat])
        }
      }

      ctx.beginPath()
      ctx.strokeStyle = ROUTE_STYLE.color
      ctx.lineWidth = (isOnlyOneRoute ? ROUTE_STYLE.singleWidth : ROUTE_STYLE.width) / transform.k
      ctx.globalAlpha = ROUTE_STYLE.opacity
      ctx.filter = `blur(${ROUTE_STYLE.blur}px)`
      if (!isOnlyOneRoute) ctx.globalCompositeOperation = 'multiply'
      path(routeFeature as any)
      ctx.stroke()
      ctx.globalAlpha = 1.0 // 恢复默认透明度
      ctx.filter = 'none' // 恢复默认滤镜
      ctx.globalCompositeOperation = 'source-over' // 恢复默认混合模式
    })

    ctx.restore()
  }, [roadNetwork, transform, showRoadNetwork])


  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    const zoom = d3.zoom()
      .scaleExtent([ZOOM_SETTINGS.min, ZOOM_SETTINGS.max])
      .translateExtent([
        [-width * ZOOM_SETTINGS.translatePadding, -height * ZOOM_SETTINGS.translatePadding],
        [width * (1 + ZOOM_SETTINGS.translatePadding), height * (1 + ZOOM_SETTINGS.translatePadding)]
      ])
      .on('zoom', (event) => {
        setTransform(event.transform)
      })

    const canvasSelection = d3.select(canvas)
    canvasSelection.call(zoom)
    // 设置初始缩放
    canvasSelection.call(
      zoom.transform as any,
      d3.zoomIdentity.scale(ZOOM_SETTINGS.initialZoom)
    )
    canvasSelection.on('dblclick.zoom', null)

    return () => {
      canvasSelection.on('.zoom', null)
    }
  }, [])

  useEffect(() => {
    renderMap()
  }, [renderMap])


  return (
    <div className="relative w-full h-full" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50">
          <div>Loading...</div>
        </div>
      )}
    </div>
  )
}
