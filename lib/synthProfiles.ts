import { ElementId, MotionMetrics, SynthInstance, SynthProfile } from './rhythmTypes'

function makeWhiteNoiseBuffer(ctx: AudioContext, seconds = 2): AudioBuffer {
  const len = ctx.sampleRate * seconds
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  return buf
}

function makePinkNoiseBuffer(ctx: AudioContext, seconds = 2): AudioBuffer {
  const len = ctx.sampleRate * seconds
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1
    b0 = 0.99886 * b0 + white * 0.0555179
    b1 = 0.99332 * b1 + white * 0.0750759
    b2 = 0.96900 * b2 + white * 0.1538520
    b3 = 0.86650 * b3 + white * 0.3104856
    b4 = 0.55000 * b4 + white * 0.5329522
    b5 = -0.7616 * b5 - white * 0.0168980
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
    b6 = white * 0.115926
  }
  return buf
}

function makeLoopedNoise(ctx: AudioContext, dest: AudioNode, buf: AudioBuffer): AudioBufferSourceNode {
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.loop = true
  src.connect(dest)
  return src
}

// ─── WALKING ────────────────────────────────────────────────────────────────

function buildWalking(ctx: AudioContext, dest: AudioNode): SynthInstance {
  const masterGain = ctx.createGain()
  const panner = ctx.createStereoPanner()
  masterGain.connect(panner)
  panner.connect(dest)

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 200
  filter.Q.value = 1.5
  filter.connect(masterGain)

  let intervalId: ReturnType<typeof setInterval> | null = null
  let bpm = 110
  let stopped = false

  function scheduleThump() {
    if (stopped) return
    const t = ctx.currentTime + 0.05
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(90, t)
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.18)
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(0.8, t + 0.01)
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
    osc.connect(env)
    env.connect(filter)
    osc.start(t)
    osc.stop(t + 0.2)
  }

  function restartInterval() {
    if (intervalId) clearInterval(intervalId)
    const ms = (60 / bpm) * 1000
    intervalId = setInterval(scheduleThump, ms)
  }

  return {
    start() {
      stopped = false
      scheduleThump()
      restartInterval()
    },
    stop() {
      stopped = true
      if (intervalId) { clearInterval(intervalId); intervalId = null }
      masterGain.disconnect()
    },
    setVolume(v) { masterGain.gain.setTargetAtTime(v, ctx.currentTime, 0.05) },
    setPan(p) { panner.pan.setTargetAtTime(p, ctx.currentTime, 0.05) },
    setMotion(m) {
      bpm = 60 + Math.round(m.overall * 80)
      restartInterval()
    },
  }
}

// ─── SEA ─────────────────────────────────────────────────────────────────────

function buildSea(ctx: AudioContext, dest: AudioNode): SynthInstance {
  const masterGain = ctx.createGain()
  const panner = ctx.createStereoPanner()
  masterGain.connect(panner)
  panner.connect(dest)

  const waveGain = ctx.createGain()
  waveGain.gain.value = 0.5
  waveGain.connect(masterGain)

  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 400
  bp.Q.value = 0.3

  const shelf = ctx.createBiquadFilter()
  shelf.type = 'lowshelf'
  shelf.frequency.value = 200
  shelf.gain.value = 8

  const noiseGain = ctx.createGain()
  noiseGain.gain.value = 0.6
  noiseGain.connect(bp)
  bp.connect(shelf)
  shelf.connect(waveGain)

  const lfo = ctx.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = 0.08
  const lfoDepth = ctx.createGain()
  lfoDepth.gain.value = 0.4
  lfo.connect(lfoDepth)
  lfoDepth.connect(waveGain.gain)

  const buf = makeWhiteNoiseBuffer(ctx, 3)
  let src: AudioBufferSourceNode | null = null

  return {
    start() {
      src = makeLoopedNoise(ctx, noiseGain, buf)
      src.start()
      lfo.start()
    },
    stop() {
      src?.stop(); src = null
      lfo.stop()
      masterGain.disconnect()
    },
    setVolume(v) { masterGain.gain.setTargetAtTime(v, ctx.currentTime, 0.05) },
    setPan(p) { panner.pan.setTargetAtTime(p, ctx.currentTime, 0.05) },
    setMotion(m) {
      lfo.frequency.setTargetAtTime(0.05 + m.overall * 0.15, ctx.currentTime, 0.5)
    },
  }
}

// ─── TREES ───────────────────────────────────────────────────────────────────

function buildTrees(ctx: AudioContext, dest: AudioNode): SynthInstance {
  const masterGain = ctx.createGain()
  const panner = ctx.createStereoPanner()
  masterGain.connect(panner)
  panner.connect(dest)

  const tremorGain = ctx.createGain()
  tremorGain.gain.value = 0.5
  tremorGain.connect(masterGain)

  // high-freq path
  const bp1 = ctx.createBiquadFilter()
  bp1.type = 'bandpass'
  bp1.frequency.value = 2800
  bp1.Q.value = 0.8
  const g1 = ctx.createGain()
  g1.gain.value = 0.55
  bp1.connect(g1)
  g1.connect(tremorGain)

  // mid-freq path
  const bp2 = ctx.createBiquadFilter()
  bp2.type = 'bandpass'
  bp2.frequency.value = 1200
  bp2.Q.value = 0.5
  const g2 = ctx.createGain()
  g2.gain.value = 0.3
  bp2.connect(g2)
  g2.connect(tremorGain)

  const lfo = ctx.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = 0.3
  const lfoDepth = ctx.createGain()
  lfoDepth.gain.value = 0.25
  lfo.connect(lfoDepth)
  lfoDepth.connect(tremorGain.gain)

  const buf = makeWhiteNoiseBuffer(ctx, 3)
  let src1: AudioBufferSourceNode | null = null
  let src2: AudioBufferSourceNode | null = null

  return {
    start() {
      src1 = makeLoopedNoise(ctx, bp1, buf); src1.start()
      src2 = makeLoopedNoise(ctx, bp2, buf); src2.start()
      lfo.start()
    },
    stop() {
      src1?.stop(); src1 = null
      src2?.stop(); src2 = null
      lfo.stop()
      masterGain.disconnect()
    },
    setVolume(v) { masterGain.gain.setTargetAtTime(v, ctx.currentTime, 0.05) },
    setPan(p) { panner.pan.setTargetAtTime(p, ctx.currentTime, 0.05) },
  }
}

// ─── BIRDS ───────────────────────────────────────────────────────────────────

const PENTATONIC = [2093, 2349, 2637, 2960, 3136]

function buildBirds(ctx: AudioContext, dest: AudioNode): SynthInstance {
  const masterGain = ctx.createGain()
  const panner = ctx.createStereoPanner()
  masterGain.connect(panner)
  panner.connect(dest)

  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 1000
  hp.connect(masterGain)

  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let stopped = false
  let motionDensityScale = 1

  function chirp(baseTime: number, freq: number) {
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, baseTime)
    osc.frequency.linearRampToValueAtTime(freq + 200, baseTime + 0.08)
    env.gain.setValueAtTime(0, baseTime)
    env.gain.linearRampToValueAtTime(0.6, baseTime + 0.01)
    env.gain.exponentialRampToValueAtTime(0.001, baseTime + 0.08)
    osc.connect(env)
    env.connect(hp)
    osc.start(baseTime)
    osc.stop(baseTime + 0.1)
  }

  function scheduleNext() {
    if (stopped) return
    const minMs = Math.max(400, 800 / motionDensityScale)
    const maxMs = Math.max(1200, 3500 / motionDensityScale)
    const delay = minMs + Math.random() * (maxMs - minMs)
    timeoutId = setTimeout(() => {
      if (stopped) return
      const t = ctx.currentTime + 0.05
      const burstSize = Math.random() < 0.3 ? 2 : 1
      const baseFreq = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)]
      chirp(t, baseFreq)
      if (burstSize === 2) chirp(t + 0.12, baseFreq - 150)
      scheduleNext()
    }, delay)
  }

  return {
    start() { stopped = false; scheduleNext() },
    stop() {
      stopped = true
      if (timeoutId) { clearTimeout(timeoutId); timeoutId = null }
      masterGain.disconnect()
    },
    setVolume(v) { masterGain.gain.setTargetAtTime(v, ctx.currentTime, 0.05) },
    setPan(p) { panner.pan.setTargetAtTime(p, ctx.currentTime, 0.05) },
    setMotion(m) { motionDensityScale = 1 + m.topZone * 2 },
  }
}

// ─── COFFEE ──────────────────────────────────────────────────────────────────

function buildCoffee(ctx: AudioContext, dest: AudioNode): SynthInstance {
  const masterGain = ctx.createGain()
  const panner = ctx.createStereoPanner()
  masterGain.connect(panner)
  panner.connect(dest)

  // hiss path
  const hissBp = ctx.createBiquadFilter()
  hissBp.type = 'bandpass'
  hissBp.frequency.value = 3000
  hissBp.Q.value = 2.5
  const hissGain = ctx.createGain()
  hissGain.gain.value = 0
  hissBp.connect(hissGain)
  hissGain.connect(masterGain)

  const buf = makeWhiteNoiseBuffer(ctx, 2)
  let noiseSrc: AudioBufferSourceNode | null = null
  let intervalId: ReturnType<typeof setInterval> | null = null
  let stopped = false

  function scheduleStir() {
    if (stopped) return
    const t = ctx.currentTime + 0.05

    // ceramic tink
    const tink = ctx.createOscillator()
    const tinkEnv = ctx.createGain()
    tink.type = 'sine'
    tink.frequency.value = 1800
    tinkEnv.gain.setValueAtTime(0, t)
    tinkEnv.gain.linearRampToValueAtTime(0.4, t + 0.003)
    tinkEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
    tink.connect(tinkEnv)
    tinkEnv.connect(masterGain)
    tink.start(t)
    tink.stop(t + 0.1)

    // octave harmonic
    const harm = ctx.createOscillator()
    const harmEnv = ctx.createGain()
    harm.type = 'sine'
    harm.frequency.value = 3600
    harmEnv.gain.setValueAtTime(0, t)
    harmEnv.gain.linearRampToValueAtTime(0.15, t + 0.003)
    harmEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
    harm.connect(harmEnv)
    harmEnv.connect(masterGain)
    harm.start(t)
    harm.stop(t + 0.08)

    // hiss swell
    hissGain.gain.setValueAtTime(0.1, t)
    hissGain.gain.linearRampToValueAtTime(0.25, t + 0.1)
    hissGain.gain.linearRampToValueAtTime(0.1, t + 0.5)
  }

  return {
    start() {
      stopped = false
      noiseSrc = makeLoopedNoise(ctx, hissBp, buf)
      noiseSrc.start()
      scheduleStir()
      intervalId = setInterval(scheduleStir, 500)
    },
    stop() {
      stopped = true
      if (intervalId) { clearInterval(intervalId); intervalId = null }
      noiseSrc?.stop(); noiseSrc = null
      masterGain.disconnect()
    },
    setVolume(v) { masterGain.gain.setTargetAtTime(v, ctx.currentTime, 0.05) },
    setPan(p) { panner.pan.setTargetAtTime(p, ctx.currentTime, 0.05) },
  }
}

// ─── RAIN ─────────────────────────────────────────────────────────────────────

function buildRain(ctx: AudioContext, dest: AudioNode): SynthInstance {
  const masterGain = ctx.createGain()
  const panner = ctx.createStereoPanner()
  masterGain.connect(panner)
  panner.connect(dest)

  const buf = makeWhiteNoiseBuffer(ctx, 3)

  function makeNoiseLayer(freq: number, q: number, gain: number, type: BiquadFilterType = 'bandpass') {
    const filter = ctx.createBiquadFilter()
    filter.type = type
    filter.frequency.value = freq
    filter.Q.value = q
    const g = ctx.createGain()
    g.gain.value = gain
    filter.connect(g)
    g.connect(masterGain)
    return filter
  }

  const layer1 = makeNoiseLayer(2000, 0.4, 0.35)
  const layer2 = makeNoiseLayer(4000, 0.6, 0.25)
  const layer3 = makeNoiseLayer(300, 0.5, 0.2, 'lowshelf')

  let sources: AudioBufferSourceNode[] = []
  let dropInterval: ReturnType<typeof setInterval> | null = null
  let stopped = false

  function scheduleDrop() {
    if (stopped) return
    const delay = 80 + Math.random() * 220
    setTimeout(() => {
      if (stopped) return
      const t = ctx.currentTime + 0.02
      const osc = ctx.createOscillator()
      const env = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 1200 + Math.random() * 1200
      env.gain.setValueAtTime(0, t)
      env.gain.linearRampToValueAtTime(0.15, t + 0.005)
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.025)
      osc.connect(env)
      env.connect(masterGain)
      osc.start(t)
      osc.stop(t + 0.03)
    }, delay)
  }

  return {
    start() {
      stopped = false
      sources = [layer1, layer2, layer3].map(f => {
        const s = makeLoopedNoise(ctx, f, buf)
        s.start()
        return s
      })
      dropInterval = setInterval(scheduleDrop, 80)
    },
    stop() {
      stopped = true
      if (dropInterval) { clearInterval(dropInterval); dropInterval = null }
      sources.forEach(s => s.stop())
      sources = []
      masterGain.disconnect()
    },
    setVolume(v) { masterGain.gain.setTargetAtTime(v, ctx.currentTime, 0.05) },
    setPan(p) { panner.pan.setTargetAtTime(p, ctx.currentTime, 0.05) },
  }
}

// ─── WIND ─────────────────────────────────────────────────────────────────────

function buildWind(ctx: AudioContext, dest: AudioNode): SynthInstance {
  const masterGain = ctx.createGain()
  const panner = ctx.createStereoPanner()
  masterGain.connect(panner)
  panner.connect(dest)

  const windGain = ctx.createGain()
  windGain.gain.value = 0.5
  windGain.connect(masterGain)

  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 250
  bp.Q.value = 0.3

  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 600
  bp.connect(lp)
  lp.connect(windGain)

  // whistle component
  const whistleBp = ctx.createBiquadFilter()
  whistleBp.type = 'bandpass'
  whistleBp.frequency.value = 800
  whistleBp.Q.value = 8
  const whistleGain = ctx.createGain()
  whistleGain.gain.value = 0.08
  whistleBp.connect(whistleGain)
  whistleGain.connect(masterGain)

  const lfo = ctx.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = 0.04
  const lfoDepth = ctx.createGain()
  lfoDepth.gain.value = 0.6
  lfo.connect(lfoDepth)
  lfoDepth.connect(windGain.gain)

  const buf = makeWhiteNoiseBuffer(ctx, 3)
  let src1: AudioBufferSourceNode | null = null
  let src2: AudioBufferSourceNode | null = null

  return {
    start() {
      src1 = makeLoopedNoise(ctx, bp, buf); src1.start()
      src2 = makeLoopedNoise(ctx, whistleBp, buf); src2.start()
      lfo.start()
    },
    stop() {
      src1?.stop(); src1 = null
      src2?.stop(); src2 = null
      lfo.stop()
      masterGain.disconnect()
    },
    setVolume(v) { masterGain.gain.setTargetAtTime(v, ctx.currentTime, 0.05) },
    setPan(p) { panner.pan.setTargetAtTime(p, ctx.currentTime, 0.05) },
  }
}

// ─── FIRE ─────────────────────────────────────────────────────────────────────

function buildFire(ctx: AudioContext, dest: AudioNode): SynthInstance {
  const masterGain = ctx.createGain()
  const panner = ctx.createStereoPanner()
  masterGain.connect(panner)
  panner.connect(dest)

  const fireBp = ctx.createBiquadFilter()
  fireBp.type = 'bandpass'
  fireBp.frequency.value = 600
  fireBp.Q.value = 0.5
  const fireGain = ctx.createGain()
  fireGain.gain.value = 0.3
  fireBp.connect(fireGain)
  fireGain.connect(masterGain)

  const buf = makePinkNoiseBuffer(ctx, 3)
  let noiseSrc: AudioBufferSourceNode | null = null
  let crackleTimeout: ReturnType<typeof setTimeout> | null = null
  let stopped = false

  function scheduleCrackle() {
    if (stopped) return
    const delay = 100 + Math.random() * 500
    crackleTimeout = setTimeout(() => {
      if (stopped) return
      const t = ctx.currentTime + 0.02
      const osc = ctx.createOscillator()
      const env = ctx.createGain()
      const peak = ctx.createBiquadFilter()
      osc.type = 'sawtooth'
      osc.frequency.value = 80 + Math.random() * 100
      peak.type = 'peaking'
      peak.frequency.value = 300 + Math.random() * 900
      peak.Q.value = 10
      peak.gain.value = 12
      env.gain.setValueAtTime(0, t)
      env.gain.linearRampToValueAtTime(0.4, t + 0.005)
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.03)
      osc.connect(peak)
      peak.connect(env)
      env.connect(masterGain)
      osc.start(t)
      osc.stop(t + 0.04)
      scheduleCrackle()
    }, delay)
  }

  return {
    start() {
      stopped = false
      noiseSrc = makeLoopedNoise(ctx, fireBp, buf)
      noiseSrc.start()
      scheduleCrackle()
    },
    stop() {
      stopped = true
      if (crackleTimeout) { clearTimeout(crackleTimeout); crackleTimeout = null }
      noiseSrc?.stop(); noiseSrc = null
      masterGain.disconnect()
    },
    setVolume(v) { masterGain.gain.setTargetAtTime(v, ctx.currentTime, 0.05) },
    setPan(p) { panner.pan.setTargetAtTime(p, ctx.currentTime, 0.05) },
  }
}

// ─── HEARTBEAT ───────────────────────────────────────────────────────────────

function buildHeartbeat(ctx: AudioContext, dest: AudioNode): SynthInstance {
  const masterGain = ctx.createGain()
  const panner = ctx.createStereoPanner()
  masterGain.connect(panner)
  panner.connect(dest)

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 120
  filter.Q.value = 2
  filter.connect(masterGain)

  let intervalId: ReturnType<typeof setInterval> | null = null
  let bpm = 72
  let stopped = false

  function scheduleHeartbeat() {
    if (stopped) return
    const t = ctx.currentTime + 0.05

    function thump(offset: number, gainPeak: number, freqStart: number, freqEnd: number, duration: number) {
      const osc = ctx.createOscillator()
      const env = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freqStart, t + offset)
      osc.frequency.exponentialRampToValueAtTime(freqEnd, t + offset + duration)
      env.gain.setValueAtTime(0, t + offset)
      env.gain.linearRampToValueAtTime(gainPeak, t + offset + 0.008)
      env.gain.exponentialRampToValueAtTime(0.001, t + offset + duration)
      osc.connect(env)
      env.connect(filter)
      osc.start(t + offset)
      osc.stop(t + offset + duration + 0.01)
    }

    thump(0, 0.9, 70, 50, 0.12)       // lub
    thump(0.2, 0.7, 65, 48, 0.09)     // dub
  }

  function restartInterval() {
    if (intervalId) clearInterval(intervalId)
    const ms = (60 / bpm) * 1000
    intervalId = setInterval(scheduleHeartbeat, ms)
  }

  return {
    start() {
      stopped = false
      scheduleHeartbeat()
      restartInterval()
    },
    stop() {
      stopped = true
      if (intervalId) { clearInterval(intervalId); intervalId = null }
      masterGain.disconnect()
    },
    setVolume(v) { masterGain.gain.setTargetAtTime(v, ctx.currentTime, 0.05) },
    setPan(p) { panner.pan.setTargetAtTime(p, ctx.currentTime, 0.05) },
    setMotion(m) {
      bpm = 50 + Math.round(m.overall * 50)
      restartInterval()
    },
  }
}

// ─── BREATH ──────────────────────────────────────────────────────────────────

function buildBreath(ctx: AudioContext, dest: AudioNode): SynthInstance {
  const masterGain = ctx.createGain()
  const panner = ctx.createStereoPanner()
  masterGain.connect(panner)
  panner.connect(dest)

  const breathGain = ctx.createGain()
  breathGain.gain.value = 0.5
  breathGain.connect(masterGain)

  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 700
  bp.Q.value = 1.2

  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 300
  bp.connect(hp)
  hp.connect(breathGain)

  // nasal hiss path
  const nasalBp = ctx.createBiquadFilter()
  nasalBp.type = 'highpass'
  nasalBp.frequency.value = 2000
  const nasalGain = ctx.createGain()
  nasalGain.gain.value = 0.06
  nasalBp.connect(nasalGain)
  nasalGain.connect(masterGain)

  const lfo = ctx.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = 0.2
  const lfoDepth = ctx.createGain()
  lfoDepth.gain.value = 0.5
  lfo.connect(lfoDepth)
  lfoDepth.connect(breathGain.gain)

  const buf = makeWhiteNoiseBuffer(ctx, 3)
  let src1: AudioBufferSourceNode | null = null
  let src2: AudioBufferSourceNode | null = null

  return {
    start() {
      src1 = makeLoopedNoise(ctx, bp, buf); src1.start()
      src2 = makeLoopedNoise(ctx, nasalBp, buf); src2.start()
      lfo.start()
    },
    stop() {
      src1?.stop(); src1 = null
      src2?.stop(); src2 = null
      lfo.stop()
      masterGain.disconnect()
    },
    setVolume(v) { masterGain.gain.setTargetAtTime(v, ctx.currentTime, 0.05) },
    setPan(p) { panner.pan.setTargetAtTime(p, ctx.currentTime, 0.05) },
  }
}

// ─── HAND ─────────────────────────────────────────────────────────────────────

function buildHand(ctx: AudioContext, dest: AudioNode): SynthInstance {
  const masterGain = ctx.createGain()
  masterGain.gain.value = 0.2
  const panner = ctx.createStereoPanner()
  masterGain.connect(panner)
  panner.connect(dest)

  const noiseGain = ctx.createGain()
  noiseGain.gain.value = 0.6
  noiseGain.connect(masterGain)

  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 180
  bp.Q.value = 2
  const shelf = ctx.createBiquadFilter()
  shelf.type = 'lowshelf'
  shelf.frequency.value = 100
  shelf.gain.value = 6
  bp.connect(shelf)
  shelf.connect(noiseGain)

  const lfo = ctx.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = 0.15
  const lfoDepth = ctx.createGain()
  lfoDepth.gain.value = 0.25
  lfo.connect(lfoDepth)
  lfoDepth.connect(noiseGain.gain)

  // sub-bass felt vibration
  const sub = ctx.createOscillator()
  sub.type = 'sine'
  sub.frequency.value = 40
  const subGain = ctx.createGain()
  subGain.gain.value = 0.08
  sub.connect(subGain)
  subGain.connect(masterGain)

  const buf = makeWhiteNoiseBuffer(ctx, 3)
  let noiseSrc: AudioBufferSourceNode | null = null

  return {
    start() {
      noiseSrc = makeLoopedNoise(ctx, bp, buf); noiseSrc.start()
      sub.start()
      lfo.start()
    },
    stop() {
      noiseSrc?.stop(); noiseSrc = null
      sub.stop()
      lfo.stop()
      masterGain.disconnect()
    },
    setVolume(v) { masterGain.gain.setTargetAtTime(v * 0.2, ctx.currentTime, 0.05) },
    setPan(p) { panner.pan.setTargetAtTime(p, ctx.currentTime, 0.05) },
  }
}

// ─── PROFILE MAP ──────────────────────────────────────────────────────────────

export const synthProfiles: Record<ElementId, SynthProfile> = {
  walking: {
    label: 'walking',
    emoji: '🚶',
    build: buildWalking,
  },
  sea: {
    label: 'sea',
    emoji: '🌊',
    build: buildSea,
  },
  trees: {
    label: 'trees',
    emoji: '🌿',
    build: buildTrees,
  },
  birds: {
    label: 'birds',
    emoji: '🐦',
    build: buildBirds,
  },
  coffee: {
    label: 'coffee',
    emoji: '☕',
    build: buildCoffee,
  },
  rain: {
    label: 'rain',
    emoji: '🌧️',
    build: buildRain,
  },
  wind: {
    label: 'wind',
    emoji: '💨',
    build: buildWind,
  },
  fire: {
    label: 'fire',
    emoji: '🔥',
    build: buildFire,
  },
  heartbeat: {
    label: 'heartbeat',
    emoji: '💓',
    build: buildHeartbeat,
  },
  breath: {
    label: 'breath',
    emoji: '🌬️',
    build: buildBreath,
  },
  hand: {
    label: 'hand',
    emoji: '🤝',
    build: buildHand,
  },
}
