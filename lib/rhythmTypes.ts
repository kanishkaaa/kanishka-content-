export type ElementId =
  | 'walking'
  | 'sea'
  | 'trees'
  | 'birds'
  | 'coffee'
  | 'rain'
  | 'wind'
  | 'fire'
  | 'heartbeat'
  | 'breath'
  | 'hand'

export interface ElementLayer {
  id: string
  elementId: ElementId
  volume: number
  pan: number
}

export interface MotionMetrics {
  overall: number
  topZone: number
  bottomZone: number
  leftZone: number
  rightZone: number
}

export interface SynthInstance {
  start(): void
  stop(): void
  setVolume(v: number): void
  setPan(p: number): void
  setMotion?(m: MotionMetrics): void
}

export interface SynthProfile {
  label: string
  emoji: string
  build(ctx: AudioContext, dest: AudioNode): SynthInstance
}
