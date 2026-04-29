'use client'

import React, { useState, useEffect } from 'react'
import { ElementId, ElementLayer } from '@/lib/rhythmTypes'
import { useAudioEngine } from '@/hooks/useAudioEngine'
import { useElementSynth } from '@/hooks/useElementSynth'
import { useCameraMotion } from '@/hooks/useCameraMotion'
import Visualizer from '@/components/rhythm/Visualizer'
import ElementMixer from '@/components/rhythm/ElementMixer'
import CameraMode from '@/components/rhythm/CameraMode'

export default function RhythmPage() {
  const [mode, setMode] = useState<'mixer' | 'camera'>('mixer')
  const [layers, setLayers] = useState<ElementLayer[]>([])
  const [isStarted, setIsStarted] = useState(false)
  const [masterVol, setMasterVol] = useState(0.8)

  const { startEngine, audioCtx, masterGain, analyser, isReady } = useAudioEngine()
  const { setMotionForAll } = useElementSynth({ layers, audioCtx, masterGain })
  const { videoRef, startCamera, stopCamera, isActive: cameraActive, motionMetrics, error: cameraError } = useCameraMotion()

  // forward motion to synths
  useEffect(() => {
    if (cameraActive) setMotionForAll(motionMetrics)
  }, [motionMetrics, cameraActive, setMotionForAll])

  // master volume
  useEffect(() => {
    if (masterGain) masterGain.gain.setTargetAtTime(masterVol, audioCtx!.currentTime, 0.05)
  }, [masterVol, masterGain, audioCtx])

  // resume context on any user interaction
  useEffect(() => {
    const resume = () => { if (audioCtx?.state === 'suspended') audioCtx.resume() }
    window.addEventListener('click', resume)
    return () => window.removeEventListener('click', resume)
  }, [audioCtx])

  function handleBegin() {
    startEngine()
    setIsStarted(true)
  }

  function addLayer(id: ElementId) {
    setLayers((prev: ElementLayer[]) => [...prev, { id: Date.now().toString(), elementId: id, volume: 0.75, pan: 0 }])
  }

  function removeLayer(instanceId: string) {
    setLayers((prev: ElementLayer[]) => prev.filter((l: ElementLayer) => l.id !== instanceId))
  }

  function updateVolume(instanceId: string, v: number) {
    setLayers((prev: ElementLayer[]) => prev.map((l: ElementLayer) => l.id === instanceId ? { ...l, volume: v } : l))
  }

  function updatePan(instanceId: string, p: number) {
    setLayers((prev: ElementLayer[]) => prev.map((l: ElementLayer) => l.id === instanceId ? { ...l, pan: p } : l))
  }

  return (
    <main className="h-screen bg-background flex flex-col overflow-hidden">
      {/* header */}
      <header className="flex-shrink-0 px-5 py-3.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="text-muted text-xs opacity-40 hover:opacity-70 transition-opacity"
          >
            ← back
          </a>
          <div>
            <h1 className="text-text-primary font-medium text-sm tracking-wide">kanishka.</h1>
            <p className="text-muted text-xs opacity-60">rhythm</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* mode toggle */}
          <div className="flex gap-1 bg-surface border border-border rounded-xl p-1">
            <button
              onClick={() => setMode('mixer')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                mode === 'mixer'
                  ? 'bg-accent text-background font-medium'
                  : 'text-muted hover:text-text-primary'
              }`}
            >
              elements
            </button>
            <button
              onClick={() => setMode('camera')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                mode === 'camera'
                  ? 'bg-accent text-background font-medium'
                  : 'text-muted hover:text-text-primary'
              }`}
            >
              camera
            </button>
          </div>

          {/* master volume */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-muted text-[10px] opacity-40">vol</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={masterVol}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMasterVol(parseFloat(e.target.value))}
              className="w-20 h-1 cursor-pointer"
              style={{ accentColor: '#d4a96a' }}
            />
          </div>
        </div>
      </header>

      {/* visualizer */}
      <div className="flex-shrink-0 border-b border-border">
        <Visualizer analyser={isReady ? analyser : null} layers={layers} isActive={isReady} />
      </div>

      {/* main area */}
      <div className="flex-1 overflow-y-auto">
        {mode === 'mixer' ? (
          <ElementMixer
            layers={layers}
            onAdd={addLayer}
            onRemove={removeLayer}
            onVolumeChange={updateVolume}
            onPanChange={updatePan}
          />
        ) : (
          <CameraMode
            videoRef={videoRef}
            startCamera={startCamera}
            stopCamera={stopCamera}
            isActive={cameraActive}
            motionMetrics={motionMetrics}
            error={cameraError}
          />
        )}
      </div>

      {/* begin overlay */}
      {!isStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-5 text-center px-8">
            <p className="text-muted text-xs opacity-50 tracking-widest uppercase">natural sound</p>
            <h2 className="text-text-primary text-2xl font-light tracking-wide">rhythm</h2>
            <p className="text-muted text-xs opacity-40 max-w-xs">
              layer natural elements — walking, sea, birds, fire — and let them breathe together
            </p>
            <button
              onClick={handleBegin}
              className="mt-2 px-8 py-3 rounded-2xl border border-accent/40 text-accent text-sm hover:bg-accent/10 transition-all active:scale-95"
            >
              begin
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
