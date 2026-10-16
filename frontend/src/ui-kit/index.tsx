import { createContext, useContext, useEffect, useId, useRef, useState, forwardRef } from 'react'
import type {
  ReactNode,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  HTMLAttributes,
} from 'react'
import {
  ArrowUpRight,
  Check,
  Clock3,
  Ellipsis,
  Pause,
  Play,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import type { Draft, MediaItem, Project } from '../types'
const projectDate = (value: string) =>
  new Intl.DateTimeFormat('uk-UA', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value))
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <span className="brand-symbol">
        <span />
        <Play size={15} fill="currentColor" strokeWidth={0} />
        <span />
      </span>
      {!compact && (
        <div>
          <strong>
            кадр<span>.</span>
          </strong>
        </div>
      )}
    </div>
  )
}
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
}) {
  return (
    <Button
      type="button"
      className={`toggle ${checked ? 'on' : ''}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    >
      <span />
    </Button>
  )
}
export function Dialog({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    ref.current?.focus()
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current()
      if (event.key === 'Tab') {
        const focusable = ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input, select, textarea, [tabindex="0"]'
        )
        if (!focusable?.length) {
          event.preventDefault()
          return
        }
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (
          event.shiftKey &&
          (document.activeElement === first || document.activeElement === ref.current)
        ) {
          event.preventDefault()
          last.focus()
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKey)
      previous?.focus()
    }
  }, [])
  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className={`dialog ${wide ? 'wide' : ''}`}
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        tabIndex={-1}
      >
        <div className="dialog-heading">
          <h2 id="dialog-title">{title}</h2>
          <Button className="icon-button" aria-label="Закрити вікно" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}
export function Preview({
  draft,
  media,
  expanded = false,
}: {
  draft: Draft
  media: MediaItem[]
  expanded?: boolean
}) {
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [muted, setMuted] = useState(true)
  const audio = useRef<HTMLAudioElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const selected = media.filter((item) => draft.mediaIds.includes(item.id) && item.type !== 'audio')
  const items = selected.length
    ? selected
    : media.filter((item) => !item.local && item.type === 'image').slice(0, 1)
  const item =
    items[Math.min(Math.floor(time / Math.max(1, draft.duration / items.length)), items.length - 1)]
  
  useEffect(() => {
    setTime(0)
    setPlaying(false)
    if (audio.current) audio.current.currentTime = 0
  }, [draft.duration, draft.mediaIds])

  useEffect(() => {
    if (!video.current) return
    if (playing) void video.current.play().catch(() => setPlaying(false))
    else video.current.pause()
  }, [playing, item])

  useEffect(() => {
    if (!audio.current) return
    if (playing) {
      void audio.current.play().catch(() => setPlaying(false))
    } else {
      audio.current.pause()
    }
  }, [playing])

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(
      () =>
        setTime((current) => {
          if (current >= draft.duration - 0.25) {
            setPlaying(false)
            if (audio.current) audio.current.currentTime = 0
            return 0
          }
          return current + 0.25
        }),
      250
    )
    return () => window.clearInterval(timer)
  }, [playing, draft.duration])

  const sentences = draft.script.split(/(?<=[.!?])\s+/).filter(Boolean)
  const sentence =
    sentences[
      Math.min(
        Math.floor(time / Math.max(1, draft.duration / sentences.length)),
        sentences.length - 1
      )
    ]
  const title = draft.topic ? draft.topic.split(':')[0].slice(0, 80) : 'Назва відео'
  const timeLabel = (seconds: number) =>
    `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
  const dimensions =
    draft.format === '9:16'
      ? '1080 × 1920'
      : draft.format === '16:9'
        ? '1920 × 1080'
        : '1080 × 1080'
  return (
    <div className={`preview-body ${expanded ? 'expanded' : ''}`}>
      <div className={`preview-frame ratio-${draft.format.replace(':', '-')}`}>
        {item?.type === 'video' ? (
          <video ref={video} src={item.url} muted={muted} loop playsInline aria-label={item.name} />
        ) : (
          <img
            src={item?.image || '/assets/carpathians.jpg'}
            alt={item?.name || 'Гірський краєвид'}
            className={playing ? 'in-motion' : ''}
          />
        )}
        
        {draft.audioUrl && (
          <audio 
            ref={audio} 
            src={`http://127.0.0.1:8000${draft.audioUrl}`} 
            muted={muted} 
            preload="auto" 
          />
        )}

        <div className="preview-shade" />
        <div className="preview-top">
          <span className="preview-format">{draft.format}</span>
        </div>
        <div className="preview-title">
          <h3
            style={
              title.length > 40
                ? {
                    fontSize: '22px',
                  }
                : title.length > 22
                  ? {
                      fontSize: '29px',
                    }
                  : undefined
            }
          >
            {title}
          </h3>
        </div>
        {playing && draft.subtitles && sentence && (
          <div className="preview-subtitle">{sentence}</div>
        )}
        <Button
          className="preview-play"
          aria-label={playing ? 'Призупинити перегляд' : 'Відтворити перегляд'}
          onClick={() => setPlaying((value) => !value)}
        >
          {playing ? (
            <Pause size={20} fill="currentColor" />
          ) : (
            <Play size={21} fill="currentColor" />
          )}
        </Button>
      </div>
      <div className="player-controls">
        <Button
          className="icon-button"
          onClick={() => setPlaying((value) => !value)}
          aria-label={playing ? 'Пауза' : 'Відтворити'}
        >
          {playing ? (
            <Pause size={15} fill="currentColor" />
          ) : (
            <Play size={15} fill="currentColor" />
          )}
        </Button>
        <span>{timeLabel(time)}</span>
        <Input
          aria-label="Позиція відтворення"
          type="range"
          min="0"
          max={draft.duration}
          step="0.25"
          value={time}
          onChange={(event) => {
            const newTime = Number(event.target.value)
            setTime(newTime)
            if (audio.current) {
              audio.current.currentTime = newTime
            }
          }}
          style={
            {
              '--progress': `${(time / draft.duration) * 100}%`,
            } as React.CSSProperties
          }
        />
        <span>{timeLabel(draft.duration)}</span>
        <Button
          className="icon-button"
          aria-label={muted ? 'Увімкнути звук' : 'Вимкнути звук'}
          title="Звукова доріжка"
          onClick={() => setMuted((value) => !value)}
          disabled={!draft.audioUrl && item?.type !== 'video'}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </Button>
      </div>
      <div className="preview-specs">
        <span>
          <Clock3 size={13} /> {draft.duration} секунд
        </span>
        <span>
          {dimensions} <b>HD</b>
        </span>
      </div>
    </div>
  )
}
export function ProjectCard({
  project,
  media,
  onOpen,
  onMenu,
  menuOpen,
  onAction,
}: {
  project: Project
  media: MediaItem[]
  onOpen: () => void
  onMenu: () => void
  menuOpen: boolean
  onAction: (action: 'rename' | 'duplicate' | 'export' | 'delete') => void
}) {
  const cover = media.find((item) => project.mediaIds.includes(item.id) && item.type !== 'audio')
  return (
    <article className="project-card">
      <Button
        className="project-cover"
        onClick={onOpen}
        aria-label={`Відкрити проєкт «${project.title}»`}
      >
        <img src={cover?.image || '/assets/carpathians.jpg'} alt="" loading="lazy" />
        <Badge status={project.status} />
        <span className="project-duration">
          {String(Math.floor(project.duration / 60)).padStart(2, '0')}:
          {String(project.duration % 60).padStart(2, '0')}
        </span>
        <span className="cover-open">
          <ArrowUpRight size={22} />
        </span>
      </Button>
      <div className="project-card-info">
        <Button className="project-title-button" onClick={onOpen}>
          {project.title}
        </Button>
        <div className="project-info-row">
          <span>
            {projectDate(project.updatedAt)} <i /> {project.format} <i /> Українська
          </span>
          <div className="project-menu-wrap">
            <Button
              className="icon-button"
              aria-label={`Дії з проєктом «${project.title}»`}
              aria-expanded={menuOpen}
              onClick={onMenu}
            >
              <Ellipsis size={19} />
            </Button>
            {menuOpen && (
              <div className="dropdown-menu">
                {[
                  ['rename', 'Перейменувати'],
                  ['duplicate', 'Створити копію'],
                  ['export', 'Завантажити JSON'],
                  ['delete', 'Видалити'],
                ].map(([action, label]) => (
                  <Button
                    key={action}
                    className={action === 'delete' ? 'danger-text' : ''}
                    onClick={() => onAction(action as 'rename' | 'duplicate' | 'export' | 'delete')}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
export function MediaCard({
  item,
  selected,
  onSelect,
  onRemove,
}: {
  item: MediaItem
  selected?: boolean
  onSelect: () => void
  onRemove?: () => void
}) {
  return (
    <article className={`media-card ${selected ? 'selected' : ''}`}>
      <Button
        className="media-cover"
        aria-label={`${selected ? 'Прибрати' : 'Обрати'} матеріал «${item.name}»`}
        aria-pressed={!!selected}
        onClick={onSelect}
      >
        {item.type === 'audio' ? (
          <div className="audio-cover">
            <Volume2 size={35} />
            <div className="waveform">
              {Array.from(
                {
                  length: 24,
                },
                (_, i) => (
                  <span
                    key={i}
                    style={{
                      height: `${12 + ((i * 7) % 25)}px`,
                    }}
                  />
                )
              )}
            </div>
          </div>
        ) : item.type === 'video' && item.local ? (
          <video src={item.url} muted preload="metadata" />
        ) : (
          <img src={item.image} alt={item.name} loading="lazy" />
        )}
        <span className="media-type">
          {item.type === 'image' ? 'Фото' : item.type === 'audio' ? 'Аудіо' : 'Відео'}
        </span>
        <span className="media-selection">{selected && <Check size={13} />}</span>
      </Button>
      <div className="media-card-info">
        <div>
          <strong>{item.name}</strong>
          <span>{item.local ? 'Власний матеріал' : item.category}</span>
        </div>
        {onRemove && (
          <Button
            className="icon-button"
            onClick={onRemove}
            aria-label={`Видалити матеріал «${item.name}»`}
          >
            <X size={15} />
          </Button>
        )}
      </div>
    </article>
  )
}

type FieldContextValue = { id: string; describedBy?: string; invalid?: boolean; required?: boolean }
const FieldContext = createContext<FieldContextValue | undefined>(undefined)
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'plain' | 'primary' | 'secondary' | 'danger' | 'ghost'
  loading?: boolean
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'plain',
    loading = false,
    className = '',
    disabled,
    children,
    type = 'button',
    ...props
  },
  ref
) {
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      className={(
        (variant === 'plain' ? '' : 'k-button k-button-' + variant) +
        ' ' +
        className
      ).trim()}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading && <span className="loading-spinner" aria-hidden="true" />}
      {children}
    </button>
  )
})
export function Field({
  label,
  id,
  hint,
  error,
  required,
  children,
}: {
  label: string
  id: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
}) {
  const describedBy = [hint ? id + '-hint' : '', error ? id + '-error' : '']
    .filter(Boolean)
    .join(' ')
  return (
    <FieldContext.Provider
      value={{ id, describedBy: describedBy || undefined, invalid: !!error, required }}
    >
      <div className="kit-field">
        <label className="field-label" htmlFor={id}>
          {label}
          {required && <span className="required"> *</span>}
        </label>
        {children}
        {hint && (
          <p className="field-help" id={id + '-hint'}>
            {hint}
          </p>
        )}
        {error && (
          <p className="field-error" role="alert" id={id + '-error'}>
            {error}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  )
}
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input(
    { id, 'aria-describedby': description, 'aria-invalid': invalid, required, ...props },
    ref
  ) {
    const field = useContext(FieldContext)
    return (
      <input
        {...props}
        ref={ref}
        id={id || field?.id}
        aria-describedby={description || field?.describedBy}
        aria-invalid={invalid ?? (field?.invalid || undefined)}
        required={required ?? field?.required}
      />
    )
  }
)
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea(
  { id, 'aria-describedby': description, 'aria-invalid': invalid, required, ...props },
  ref
) {
  const field = useContext(FieldContext)
  return (
    <textarea
      {...props}
      ref={ref}
      id={id || field?.id}
      aria-describedby={description || field?.describedBy}
      aria-invalid={invalid ?? (field?.invalid || undefined)}
      required={required ?? field?.required}
    />
  )
})
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select(
    { id, 'aria-describedby': description, 'aria-invalid': invalid, required, ...props },
    ref
  ) {
    const field = useContext(FieldContext)
    return (
      <select
        {...props}
        ref={ref}
        id={id || field?.id}
        aria-describedby={description || field?.describedBy}
        aria-invalid={invalid ?? (field?.invalid || undefined)}
        required={required ?? field?.required}
      />
    )
  }
)
export function Badge({ status }: { status: 'draft' | 'ready' }) {
  return (
    <span className={'project-status ' + status}>
      <span />
      {status === 'ready' ? 'Збережено' : 'Чернетка'}
    </span>
  )
}
export function StepNavigation({
  labels,
  current,
  onChange,
}: {
  labels: string[]
  current: number
  onChange: (index: number) => void
}) {
  return (
    <div className="steps" aria-label="Етапи створення відео">
      {labels.map((label, index) => (
        <Button
          key={label}
          className={
            'step ' +
            (current === index ? 'active' : '') +
            ' ' +
            (index < current ? 'complete' : '')
          }
          onClick={() => onChange(index)}
          aria-current={current === index ? 'step' : undefined}
        >
          <span className="step-number">{index < current ? <Check size={14} /> : index + 1}</span>
          <span>{label}</span>
        </Button>
      ))}
    </div>
  )
}
export function FormatChoice({
  value,
  onChange,
}: {
  value: '9:16' | '16:9' | '1:1'
  onChange: (value: '9:16' | '16:9' | '1:1') => void
}) {
  const name = useId()
  const options = [
    { value: '9:16' as const, title: 'Вертикальний', detail: 'Reels, Shorts, TikTok' },
    { value: '16:9' as const, title: 'Горизонтальний', detail: 'YouTube, презентації' },
    { value: '1:1' as const, title: 'Квадратний', detail: 'Дописи, реклама' },
  ]
  return (
    <fieldset className="kit-format">
      <legend className="field-label">Формат відео</legend>
      <div className="format-options">
        {options.map((option) => (
          <label
            key={option.value}
            className={'format-option ' + (value === option.value ? 'selected' : '')}
          >
            <Input
              className="kit-radio"
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span className={'format-icon format-' + option.value.replace(':', '-')}>
              <i />
            </span>
            <span className="format-ratio">{option.value}</span>
            <strong>{option.title}</strong>
            <small>{option.detail}</small>
            {value === option.value && (
              <span className="format-check">
                <Check size={10} strokeWidth={3} />
              </span>
            )}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
export function EmptyState({ children, className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section {...props} className={('empty-state ' + className).trim()}>
      {children}
    </section>
  )
}
export function Notice({
  children,
  className = '',
  role = 'status',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} role={role} className={className}>
      {children}
    </div>
  )
}