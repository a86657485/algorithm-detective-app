import { cn } from '../../lib/cn'

interface MascotProps {
  size?: number
  /** 表情：normal 微笑 / happy 开心 / think 思考 */
  mood?: 'normal' | 'happy' | 'think'
  className?: string
}

/**
 * 侦探小狐狸「阿算」。
 *
 * 用内联 SVG 而不是位图，一是断网机房也能正常显示，二是投影仪放大不会糊，
 * 三是配色可以直接跟着三区语义色走。
 */
export function Mascot({ size = 160, mood = 'normal', className }: MascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label="侦探小狐狸阿算"
      className={cn('shrink-0 drop-shadow-[0_8px_14px_rgba(34,39,46,0.16)]', className)}
    >
      {/* 耳朵（向外张开，避免被帽子挡住） */}
      <path d="M60 90 L24 40 L94 60 Z" fill="#E69138" stroke="#A85E18" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M140 90 L176 40 L106 60 Z" fill="#E69138" stroke="#A85E18" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M64 84 L38 50 L84 64 Z" fill="#FFD9A8" />
      <path d="M136 84 L162 50 L116 64 Z" fill="#FFD9A8" />

      {/* 头 */}
      <circle cx="100" cy="112" r="56" fill="#F2A93B" stroke="#A85E18" strokeWidth="3.5" />

      {/* 面部白色区域 */}
      <path
        d="M100 166 C60 166 46 138 54 112 C61 90 80 82 100 82 C120 82 139 90 146 112 C154 138 140 166 100 166 Z"
        fill="#FFF6E6"
      />

      {/* 眼睛 */}
      {mood === 'happy' ? (
        <>
          <path d="M70 112 q10 -12 20 0" stroke="#2B2B2B" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M110 112 q10 -12 20 0" stroke="#2B2B2B" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="78" cy="113" rx="7.5" ry="9" fill="#2B2B2B" />
          <ellipse cx="122" cy="113" rx="7.5" ry="9" fill="#2B2B2B" />
          <circle cx="80.6" cy="109.4" r="2.6" fill="#FFFFFF" />
          <circle cx="124.6" cy="109.4" r="2.6" fill="#FFFFFF" />
        </>
      )}

      {/* 鼻子与嘴 */}
      <path d="M92 131 L108 131 L100 141 Z" fill="#2B2B2B" strokeLinejoin="round" />
      <path
        d="M100 141 v5 M100 146 q-9 9 -16 1 M100 146 q9 9 16 1"
        stroke="#2B2B2B"
        strokeWidth="2.8"
        fill="none"
        strokeLinecap="round"
      />

      {/* 腮红 */}
      <ellipse cx="63" cy="134" rx="8" ry="5" fill="#F6A6A6" opacity="0.55" />
      <ellipse cx="137" cy="134" rx="8" ry="5" fill="#F6A6A6" opacity="0.55" />

      {/* 猎鹿帽 */}
      <path d="M66 68 C66 42 80 30 100 30 C120 30 134 42 134 68 Z" fill="#8B5E3C" stroke="#5E3E26" strokeWidth="3.5" />
      <path
        d="M54 66 q46 -13 92 0 l9 10 q-55 -14 -110 0 Z"
        fill="#6E4A2E"
        stroke="#5E3E26"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M90 46 q10 -7 20 0 q-10 6 -20 0 Z" fill="#A9743F" opacity="0.85" />

      {/* 放大镜 */}
      <circle cx="156" cy="150" r="21" fill="#EAF3FF" stroke="#4A86E8" strokeWidth="6" />
      <circle cx="156" cy="150" r="21" fill="#4A86E8" opacity="0.14" />
      <path d="M149 143 q6 -6 13 -2" stroke="#FFFFFF" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M171 165 l13 13" stroke="#8B5E3C" strokeWidth="9" strokeLinecap="round" />
    </svg>
  )
}
