import { create } from 'zustand'
import type { ToastPayload } from '../components/common/BadgeToast'

interface UiState {
  toast: ToastPayload | null
  /** 每次 +1 就重放一次撒花动画 */
  confettiKey: number
  /** 案件看板（关卡地图）是否展开 */
  mapOpen: boolean
  showToast: (payload: Omit<ToastPayload, 'key'>) => void
  closeToast: () => void
  fireConfetti: () => void
  openMap: () => void
  closeMap: () => void
}

/** 纯界面状态：提示条、庆祝动画与看板开关，不进入本地存档 */
export const useUiStore = create<UiState>()((set) => ({
  toast: null,
  confettiKey: 0,
  mapOpen: false,
  showToast: (payload) => set({ toast: { ...payload, key: Date.now() } }),
  closeToast: () => set({ toast: null }),
  fireConfetti: () => set((s) => ({ confettiKey: s.confettiKey + 1 })),
  openMap: () => set({ mapOpen: true }),
  closeMap: () => set({ mapOpen: false }),
}))

export function toastBadge(emoji: string, title: string, desc?: string): void {
  useUiStore.getState().showToast({ emoji, title, desc, tone: 'badge' })
}

export function toastInfo(emoji: string, title: string, desc?: string): void {
  useUiStore.getState().showToast({ emoji, title, desc, tone: 'info' })
}

export function toastWarn(emoji: string, title: string, desc?: string): void {
  useUiStore.getState().showToast({ emoji, title, desc, tone: 'warn' })
}
