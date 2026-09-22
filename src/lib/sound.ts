/**
 * 音效模块：全部用 Web Audio API 现场合成，不带任何音频文件。
 * 机房可能没有外网，也不希望因为音频资源缺失而报错，所以这里做成"失败就静默"。
 */
export type SoundName = 'click' | 'success' | 'error' | 'badge' | 'stamp' | 'carry' | 'pop'

let ctx: AudioContext | null = null
let muted = false

type AudioCtor = new () => AudioContext

function resolveCtor(): AudioCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor }
  return w.AudioContext ?? w.webkitAudioContext ?? null
}

function getCtx(): AudioContext | null {
  if (muted) return null
  const Ctor = resolveCtor()
  if (!Ctor) return null
  if (!ctx) {
    try {
      ctx = new Ctor()
    } catch (err) {
      console.error('无法创建音频上下文，已自动静音', err)
      return null
    }
  }
  if (ctx.state === 'suspended') {
    ctx.resume().catch((err) => console.error('音频上下文恢复失败', err))
  }
  return ctx
}

interface ToneOptions {
  freq: number
  /** 相对于本次播放起点的延迟（秒） */
  delay?: number
  duration?: number
  type?: OscillatorType
  gain?: number
  /** 频率滑到该值，做出"咻"的效果 */
  slideTo?: number
}

function tone(audio: AudioContext, opt: ToneOptions): void {
  const t0 = audio.currentTime + (opt.delay ?? 0)
  const dur = opt.duration ?? 0.12
  const osc = audio.createOscillator()
  const amp = audio.createGain()

  osc.type = opt.type ?? 'sine'
  osc.frequency.setValueAtTime(opt.freq, t0)
  if (opt.slideTo) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, opt.slideTo), t0 + dur)
  }

  const peak = opt.gain ?? 0.16
  amp.gain.setValueAtTime(0.0001, t0)
  amp.gain.exponentialRampToValueAtTime(peak, t0 + 0.012)
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)

  osc.connect(amp)
  amp.connect(audio.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

const RECIPES: Record<SoundName, (audio: AudioContext) => void> = {
  click: (a) => tone(a, { freq: 660, duration: 0.07, type: 'triangle', gain: 0.1 }),
  pop: (a) => tone(a, { freq: 880, duration: 0.09, type: 'sine', gain: 0.12, slideTo: 1320 }),
  carry: (a) => {
    tone(a, { freq: 520, duration: 0.1, type: 'triangle', gain: 0.12, slideTo: 1040 })
    tone(a, { freq: 1040, delay: 0.09, duration: 0.09, type: 'sine', gain: 0.08 })
  },
  success: (a) => {
    tone(a, { freq: 523.25, duration: 0.13, type: 'sine', gain: 0.15 })
    tone(a, { freq: 659.25, delay: 0.1, duration: 0.13, type: 'sine', gain: 0.15 })
    tone(a, { freq: 783.99, delay: 0.2, duration: 0.2, type: 'sine', gain: 0.16 })
  },
  badge: (a) => {
    tone(a, { freq: 587.33, duration: 0.12, type: 'triangle', gain: 0.14 })
    tone(a, { freq: 880, delay: 0.1, duration: 0.14, type: 'triangle', gain: 0.14 })
    tone(a, { freq: 1174.66, delay: 0.22, duration: 0.26, type: 'sine', gain: 0.13 })
  },
  stamp: (a) => {
    tone(a, { freq: 140, duration: 0.16, type: 'square', gain: 0.13, slideTo: 60 })
    tone(a, { freq: 320, delay: 0.02, duration: 0.1, type: 'triangle', gain: 0.09 })
  },
  error: (a) => {
    tone(a, { freq: 300, duration: 0.16, type: 'sawtooth', gain: 0.1, slideTo: 180 })
    tone(a, { freq: 200, delay: 0.14, duration: 0.18, type: 'sawtooth', gain: 0.09 })
  },
}

export function playSound(name: SoundName): void {
  const audio = getCtx()
  if (!audio) return
  RECIPES[name](audio)
}

export function setSoundMuted(value: boolean): void {
  muted = value
}

export function isSoundMuted(): boolean {
  return muted
}
