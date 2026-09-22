import { useCallback, useState } from 'react'
import type { DragEvent } from 'react'

/**
 * 拖拽逻辑。
 *
 * 机房电脑用鼠标操作，所以直接用浏览器原生的 HTML5 拖放，不引入额外依赖。
 * 同时额外提供"点一下选中 → 再点一下目标"的备用路径：
 * 对小学生来说，点选比一直按住鼠标左键更稳，也方便老师在大屏上演示。
 */

export interface CardHandlers {
  draggable: true
  onDragStart: (e: DragEvent<HTMLElement>) => void
  onDragEnd: () => void
}

export interface ZoneHandlers {
  onDragOver: (e: DragEvent<HTMLElement>) => void
  onDragEnter: (e: DragEvent<HTMLElement>) => void
  onDragLeave: (e: DragEvent<HTMLElement>) => void
  onDrop: (e: DragEvent<HTMLElement>) => void
  onClick: () => void
}

export interface DragDropApi<Z extends string> {
  /** 正在被拖动 / 被点选的卡片 id */
  activeId: string | null
  /** 鼠标悬停的目标区 */
  hotZone: Z | null
  cardHandlers: (cardId: string) => CardHandlers
  zoneHandlers: (zone: Z) => ZoneHandlers
  select: (cardId: string | null) => void
  clear: () => void
}

export function useDragDrop<Z extends string>(onDrop: (cardId: string, zone: Z) => void): DragDropApi<Z> {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [hotZone, setHotZone] = useState<Z | null>(null)

  const clear = useCallback(() => {
    setActiveId(null)
    setHotZone(null)
  }, [])

  const select = useCallback((cardId: string | null) => {
    setActiveId((cur) => (cur === cardId ? null : cardId))
  }, [])

  const cardHandlers = useCallback(
    (cardId: string): CardHandlers => ({
      draggable: true,
      onDragStart: (e) => {
        e.dataTransfer.setData('text/plain', cardId)
        e.dataTransfer.effectAllowed = 'move'
        setActiveId(cardId)
      },
      onDragEnd: () => clear(),
    }),
    [clear],
  )

  const zoneHandlers = useCallback(
    (zone: Z): ZoneHandlers => ({
      onDragOver: (e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setHotZone(zone)
      },
      onDragEnter: (e) => {
        e.preventDefault()
        setHotZone(zone)
      },
      onDragLeave: (e) => {
        // 只有真正离开区域时才取消高亮，避免子元素触发 leave
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
        setHotZone((cur) => (cur === zone ? null : cur))
      },
      onDrop: (e) => {
        e.preventDefault()
        const id = e.dataTransfer.getData('text/plain') || activeId
        if (id) onDrop(id, zone)
        clear()
      },
      onClick: () => {
        if (activeId) {
          onDrop(activeId, zone)
          clear()
        }
      },
    }),
    [activeId, clear, onDrop],
  )

  return { activeId, hotZone, cardHandlers, zoneHandlers, select, clear }
}

/* ------------------------------------------------------------------ */
/*                          纵向列表排序                                */
/* ------------------------------------------------------------------ */

export interface ReorderApi {
  draggingId: string | null
  overId: string | null
  itemHandlers: (id: string) => {
    draggable: true
    onDragStart: (e: DragEvent<HTMLElement>) => void
    onDragOver: (e: DragEvent<HTMLElement>) => void
    onDragLeave: () => void
    onDrop: (e: DragEvent<HTMLElement>) => void
    onDragEnd: () => void
  }
}

/** 把 fromId 移动到 toId 的位置 */
export function moveItem(list: string[], fromId: string, toId: string): string[] {
  if (fromId === toId) return list
  const next = list.slice()
  const fromIdx = next.indexOf(fromId)
  const toIdx = next.indexOf(toId)
  if (fromIdx < 0 || toIdx < 0) return list
  next.splice(fromIdx, 1)
  next.splice(toIdx, 0, fromId)
  return next
}

export function useReorder(onMove: (fromId: string, toId: string) => void): ReorderApi {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  return {
    draggingId,
    overId,
    itemHandlers: (id) => ({
      draggable: true,
      onDragStart: (e) => {
        e.dataTransfer.setData('text/plain', id)
        e.dataTransfer.effectAllowed = 'move'
        setDraggingId(id)
      },
      onDragOver: (e) => {
        e.preventDefault()
        setOverId(id)
      },
      onDragLeave: () => setOverId((cur) => (cur === id ? null : cur)),
      onDrop: (e) => {
        e.preventDefault()
        const from = e.dataTransfer.getData('text/plain') || draggingId
        if (from) onMove(from, id)
        setDraggingId(null)
        setOverId(null)
      },
      onDragEnd: () => {
        setDraggingId(null)
        setOverId(null)
      },
    }),
  }
}
