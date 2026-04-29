'use client'

import { RefObject } from 'react'
import { MotionMetrics } from '@/lib/rhythmTypes'

interface CameraModeProps {
  videoRef: RefObject<HTMLVideoElement>
  startCamera: () => void
  stopCamera: () => void
  isActive: boolean
  motionMetrics: MotionMetrics
  error: string | null
}

function MeterBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted text-[10px] opacity-50 w-10 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-100"
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
      <span className="text-muted text-[10px] opacity-40 w-6 text-right flex-shrink-0">
        {Math.round(value * 100)}
      </span>
    </div>
  )
}

export default function CameraMode({ videoRef, startCamera, stopCamera, isActive, motionMetrics, error }: CameraModeProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 p-4">
      {/* camera preview */}
      <div className="flex-1 min-h-[180px] flex items-center justify-center">
        {isActive ? (
          <div className="relative w-full max-w-xs">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full rounded-2xl border-2 border-accent/30 object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            <button
              onClick={stopCamera}
              className="absolute top-2 right-2 text-[10px] px-2 py-1 rounded-md bg-background/80 border border-border text-muted hover:text-text-primary transition-colors"
            >
              stop
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 w-full max-w-xs">
            <div
              className="w-full rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-center"
              style={{ height: 180 }}
            >
              <span className="text-3xl opacity-40">📷</span>
              <p className="text-muted text-xs opacity-50">motion drives the music</p>
            </div>
            {error && (
              <p className="text-xs text-red-400/70">{error}</p>
            )}
            <button
              onClick={startCamera}
              className="px-4 py-2 rounded-xl border border-accent/30 text-accent text-xs hover:bg-accent/10 transition-colors"
            >
              enable camera
            </button>
          </div>
        )}
      </div>

      {/* motion meters */}
      <div className="flex-1 flex flex-col justify-center gap-3 px-2">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="h-8 w-8 rounded-full border-2 flex items-center justify-center flex-shrink-0"
            style={{
              borderColor: `rgba(212,169,106,${0.2 + motionMetrics.overall * 0.8})`,
              background: `rgba(212,169,106,${motionMetrics.overall * 0.15})`,
            }}
          >
            <span className="text-accent text-xs font-medium">{Math.round(motionMetrics.overall * 100)}</span>
          </div>
          <div>
            <p className="text-text-primary text-xs">overall motion</p>
            <p className="text-muted text-[10px] opacity-40">drives tempo &amp; intensity</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <MeterBar label="top" value={motionMetrics.topZone} />
          <MeterBar label="bottom" value={motionMetrics.bottomZone} />
          <MeterBar label="left" value={motionMetrics.leftZone} />
          <MeterBar label="right" value={motionMetrics.rightZone} />
        </div>

        <p className="text-muted text-[10px] opacity-30 mt-1">
          walk · sway · pour · breathe
        </p>
      </div>
    </div>
  )
}
