import { useRef, useState, useCallback } from 'react'

export interface AudioEngine {
  audioCtx: AudioContext | null
  masterGain: GainNode | null
  analyser: AnalyserNode | null
  isReady: boolean
  startEngine: () => void
  stopEngine: () => void
}

export function useAudioEngine(): AudioEngine {
  const audioCtxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const [isReady, setIsReady] = useState(false)

  const startEngine = useCallback(() => {
    if (audioCtxRef.current) {
      // resume if suspended (e.g. after tab switch)
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume()
      }
      return
    }

    // Safari fallback
    const AudioCtxClass =
      window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtxClass) return

    const ctx = new AudioCtxClass()
    const masterGain = ctx.createGain()
    masterGain.gain.value = 0.8

    const analyser = ctx.createAnalyser()
    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0.8

    masterGain.connect(analyser)
    analyser.connect(ctx.destination)

    audioCtxRef.current = ctx
    masterGainRef.current = masterGain
    analyserRef.current = analyser
    setIsReady(true)
  }, [])

  const stopEngine = useCallback(() => {
    audioCtxRef.current?.suspend()
  }, [])

  return {
    audioCtx: audioCtxRef.current,
    masterGain: masterGainRef.current,
    analyser: analyserRef.current,
    isReady,
    startEngine,
    stopEngine,
  }
}
