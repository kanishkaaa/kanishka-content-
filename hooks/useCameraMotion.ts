import { useRef, useState, useCallback } from 'react'
import { MotionMetrics } from '@/lib/rhythmTypes'

const ZERO_METRICS: MotionMetrics = { overall: 0, topZone: 0, bottomZone: 0, leftZone: 0, rightZone: 0 }

export function useCameraMotion() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const offscreenRef = useRef<HTMLCanvasElement | null>(null)
  const prevDataRef = useRef<Uint8ClampedArray | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef<number>(0)
  const smoothedRef = useRef<MotionMetrics>({ ...ZERO_METRICS })
  const streamRef = useRef<MediaStream | null>(null)

  const [isActive, setIsActive] = useState(false)
  const [motionMetrics, setMotionMetrics] = useState<MotionMetrics>({ ...ZERO_METRICS })
  const [error, setError] = useState<string | null>(null)

  const analyzeFrame = useCallback(() => {
    const video = videoRef.current
    if (!video || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(analyzeFrame)
      return
    }

    const now = performance.now()
    if (now - lastFrameTimeRef.current < 100) {
      rafRef.current = requestAnimationFrame(analyzeFrame)
      return
    }
    lastFrameTimeRef.current = now

    const W = video.videoWidth || 320
    const H = video.videoHeight || 240

    if (!offscreenRef.current) {
      offscreenRef.current = document.createElement('canvas')
    }
    const canvas = offscreenRef.current
    canvas.width = W
    canvas.height = H

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      rafRef.current = requestAnimationFrame(analyzeFrame)
      return
    }

    ctx.drawImage(video, 0, 0, W, H)
    const frame = ctx.getImageData(0, 0, W, H)
    const data = frame.data
    const total = W * H

    if (!prevDataRef.current || prevDataRef.current.length !== data.length) {
      prevDataRef.current = new Uint8ClampedArray(data)
      rafRef.current = requestAnimationFrame(analyzeFrame)
      return
    }

    const prev = prevDataRef.current
    const thirdH = Math.floor(H / 3)
    const thirdW = Math.floor(W / 3)

    let changed = 0
    let topChanged = 0, bottomChanged = 0, leftChanged = 0, rightChanged = 0
    let topTotal = 0, bottomTotal = 0, leftTotal = 0, rightTotal = 0

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4
        const diff = Math.abs(data[i] - prev[i]) + Math.abs(data[i + 1] - prev[i + 1]) + Math.abs(data[i + 2] - prev[i + 2])
        const isChanged = diff > 25 ? 1 : 0
        changed += isChanged

        if (y < thirdH) { topChanged += isChanged; topTotal++ }
        else if (y >= H - thirdH) { bottomChanged += isChanged; bottomTotal++ }

        if (x < thirdW) { leftChanged += isChanged; leftTotal++ }
        else if (x >= W - thirdW) { rightChanged += isChanged; rightTotal++ }
      }
    }

    const rawOverall = Math.min((changed / total) * 4, 1)
    const rawTop = topTotal > 0 ? Math.min((topChanged / topTotal) * 4, 1) : 0
    const rawBottom = bottomTotal > 0 ? Math.min((bottomChanged / bottomTotal) * 4, 1) : 0
    const rawLeft = leftTotal > 0 ? Math.min((leftChanged / leftTotal) * 4, 1) : 0
    const rawRight = rightTotal > 0 ? Math.min((rightChanged / rightTotal) * 4, 1) : 0

    const dead = (v: number) => v < 0.05 ? 0 : v
    const a = 0.3
    const s = smoothedRef.current
    const next: MotionMetrics = {
      overall: dead(s.overall * (1 - a) + rawOverall * a),
      topZone: dead(s.topZone * (1 - a) + rawTop * a),
      bottomZone: dead(s.bottomZone * (1 - a) + rawBottom * a),
      leftZone: dead(s.leftZone * (1 - a) + rawLeft * a),
      rightZone: dead(s.rightZone * (1 - a) + rawRight * a),
    }
    smoothedRef.current = next
    setMotionMetrics({ ...next })

    prevDataRef.current = new Uint8ClampedArray(data)
    rafRef.current = requestAnimationFrame(analyzeFrame)
  }, [])

  const startCamera = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setIsActive(true)
      rafRef.current = requestAnimationFrame(analyzeFrame)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Camera access denied')
    }
  }, [analyzeFrame])

  const stopCamera = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    streamRef.current?.getTracks().forEach((t: MediaStreamTrack) => t.stop())
    streamRef.current = null
    prevDataRef.current = null
    smoothedRef.current = { ...ZERO_METRICS }
    setIsActive(false)
    setMotionMetrics({ ...ZERO_METRICS })
  }, [])

  return { videoRef, startCamera, stopCamera, isActive, motionMetrics, error }
}
