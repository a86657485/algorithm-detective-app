import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { playSound } from '../../lib/sound'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'
type Size = 'sm' | 'md' | 'lg'

const VARIANT: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-zproc to-zin text-white shadow-card hover:shadow-cardHover hover:brightness-105',
  gold: 'bg-gradient-to-r from-zout to-[#F2B33D] text-white shadow-card hover:shadow-cardHover hover:brightness-105',
  secondary:
    'bg-white text-ink border-2 border-black/10 shadow-sm hover:border-zproc/60 hover:text-zproc-dark hover:shadow-card',
  ghost: 'bg-transparent text-ink2 hover:bg-black/5 hover:text-ink',
  danger: 'bg-red-500 text-white shadow-sm hover:bg-red-600',
}

const SIZE: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm rounded-xl gap-1.5',
  md: 'h-12 px-5 text-base rounded-2xl gap-2',
  lg: 'h-14 px-7 text-lg rounded-2xl gap-2.5',
}

export interface GameButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  /** 点一下不播放音效（例如静音开关本身） */
  silent?: boolean
}

export function GameButton({
  variant = 'primary',
  size = 'md',
  icon,
  silent = false,
  className,
  children,
  disabled,
  onClick,
  ...rest
}: GameButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        if (!silent) playSound('click')
        onClick?.(e)
      }}
      className={cn(
        'inline-flex select-none items-center justify-center font-semibold transition-all duration-200',
        'focus:outline-none focus-visible:ring-4 focus-visible:ring-zproc/30',
        VARIANT[variant],
        SIZE[size],
        disabled
          ? 'cursor-not-allowed opacity-45 saturate-50 hover:shadow-card hover:brightness-100'
          : 'cursor-pointer active:translate-y-px active:scale-[0.985]',
        className,
      )}
      {...rest}
    >
      {icon ? <span className="shrink-0">{icon}</span> : null}
      {children}
    </button>
  )
}
