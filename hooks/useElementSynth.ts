import { useEffect, useRef, useCallback } from 'react'
import { ElementLayer, MotionMetrics, SynthInstance } from '@/lib/rhythmTypes'
import { synthProfiles } from '@/lib/synthProfiles'

interface UseElementSynthProps {
  layers: ElementLayer[]
  audioCtx: AudioContext | null
  masterGain: AudioNode | null
}

export function useElementSynth({ layers, audioCtx, masterGain }: UseElementSynthProps) {
  const instancesRef = useRef<Map<string, SynthInstance>>(new Map())
  const prevLayersRef = useRef<ElementLayer[]>([])

  useEffect(() => {
    if (!audioCtx || !masterGain) return

    const prev = prevLayersRef.current
    const prevIds = new Set(prev.map((l: ElementLayer) => l.id))
    const nextIds = new Set(layers.map((l: ElementLayer) => l.id))

    // stop removed layers
    for (const layer of prev) {
      if (!nextIds.has(layer.id)) {
        instancesRef.current.get(layer.id)?.stop()
        instancesRef.current.delete(layer.id)
      }
    }

    // start added layers
    for (const layer of layers) {
      if (!prevIds.has(layer.id)) {
        if (audioCtx.state === 'suspended') audioCtx.resume()
        const profile = synthProfiles[layer.elementId]
        const instance = profile.build(audioCtx, masterGain)
        instance.setVolume(layer.volume)
        instance.setPan(layer.pan)
        instance.start()
        instancesRef.current.set(layer.id, instance)
      }
    }

    // update volume/pan for existing layers
    for (const layer of layers) {
      if (prevIds.has(layer.id)) {
        const prevLayer = prev.find((l: ElementLayer) => l.id === layer.id)
        const instance = instancesRef.current.get(layer.id)
        if (!instance || !prevLayer) continue
        if (prevLayer.volume !== layer.volume) instance.setVolume(layer.volume)
        if (prevLayer.pan !== layer.pan) instance.setPan(layer.pan)
      }
    }

    prevLayersRef.current = layers
  }, [layers, audioCtx, masterGain])

  // cleanup all on unmount
  useEffect(() => {
    return () => {
      instancesRef.current.forEach((inst: SynthInstance) => inst.stop())
      instancesRef.current.clear()
    }
  }, [])

  const setMotionForAll = useCallback((m: MotionMetrics) => {
    instancesRef.current.forEach((inst: SynthInstance) => {
      inst.setMotion?.(m)
    })
  }, [])

  return { setMotionForAll }
}
