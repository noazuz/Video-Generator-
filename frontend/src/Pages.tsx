import { useRef, useState } from 'react'
import {
  ArrowRight,
  Check,
  ChevronDown,
  Download,
  Film,
  ImagePlus,
  Info,
  Search,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react'
import { Button, EmptyState, Input, MediaCard, Select, Toggle } from './ui-kit'
import type { MediaItem, Settings, VideoFormat } from './types'
export function MediaPage({
  media,
  selectedIds,
  onToggle,
  onUpload,
  onRemove,
  onStudio,
}: {
  media: MediaItem[]
  selectedIds: string[]
  onToggle: (id: string) => void
  onUpload: (files: FileList | null) => void
  onRemove: (id: string) => void
  onStudio: () => void
}) {
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const visible = media.filter(
    (item) =>
      (filter === 'all' || (filter === 'own' && item.local) || item.type === filter) &&
      `${item.name} ${item.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase())
  )
  return (
    <>
      <div
        className={`upload-zone ${dragging ? 'dragging' : ''}`}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          onUpload(event.dataTransfer.files)
        }}
      >
        <span className="upload-zone-icon">
          <Upload size={25} />
        </span>
        <div>
          <h3>Завантажити матеріали</h3>
          <p>Перетягни фото, відео чи аудіо сюди або обери файли.</p>
          <span>JPG, PNG, WebP, MP4, WebM, MP3, WAV · до 50 МБ на файл</span>
        </div>
        <Button className="secondary-button" onClick={() => inputRef.current?.click()}>
          <ImagePlus size={16} /> Обрати файли
        </Button>
        <Input
          ref={inputRef}
          type="file"
          multiple
          hidden
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,audio/mpeg,audio/wav"
          onChange={(event) => {
            onUpload(event.target.files)
            event.target.value = ''
          }}
        />
      </div>
      <div className="list-toolbar">
        <div className="filter-tabs">
          {[
            ['all', 'Усі матеріали'],
            ['image', 'Фото'],
            ['video', 'Відео'],
            ['audio', 'Аудіо'],
            ['own', 'Завантажені'],
          ].map(([id, name]) => (
            <Button
              key={id}
              className={filter === id ? 'active' : ''}
              onClick={() => setFilter(id)}
            >
              {name}
            </Button>
          ))}
        </div>
        <div className="search-field">
          <Search size={16} />
          <Input
            aria-label="Пошук у медіатеці"
            placeholder="Знайти матеріал…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <Button
              className="icon-button"
              aria-label="Очистити пошук"
              onClick={() => setQuery('')}
            >
              <X size={14} />
            </Button>
          )}
        </div>
      </div>
      <div className="media-page-grid">
        {visible.map((item) => (
          <MediaCard
            key={item.id}
            item={item}
            selected={selectedIds.includes(item.id)}
            onSelect={() => onToggle(item.id)}
            onRemove={item.local ? () => onRemove(item.id) : undefined}
          />
        ))}
      </div>
      {!visible.length && (
        <EmptyState>
          <ImagePlus size={35} />
          <h3>{query ? 'Матеріалів не знайдено' : 'Тут з’являться твої матеріали'}</h3>
          <p>
            {query
              ? 'Спробуй інші ключові слова.'
              : 'Завантаж перший файл, щоб додати його до проєкту.'}
          </p>
          <Button
            className="secondary-button"
            onClick={() => (query ? setQuery('') : inputRef.current?.click())}
          >
            {query ? 'Очистити пошук' : 'Завантажити файл'}
          </Button>
        </EmptyState>
      )}
      <div className="library-footer">
        <span>
          <Info size={14} /> Завантажені файли доступні до закриття або перезавантаження сторінки.
        </span>
        <Button className="text-button" onClick={onStudio}>
          До редактора <ArrowRight size={15} />
        </Button>
      </div>
    </>
  )
}
export function SettingsPage({
  settings,
  onSave,
  onToast,
  onReset,
}: {
  settings: Settings
  onSave: (settings: Settings) => void
  onToast: (message: string) => void
  onReset: () => void
}) {
  const [local, setLocal] = useState(settings)
  return (
    <div className="settings-layout">
      <div className="settings-main">
        <section className="settings-card">
          <div className="settings-card-title">
            <Film size={20} />
            <div>
              <h2>Параметри проєктів</h2>
              <p>Початкові параметри нових проєктів.</p>
            </div>
          </div>
          <div className="settings-fields">
            <div className="field-row">
              <div className="field">
                <label className="field-label" htmlFor="default-format">
                  Формат за замовчуванням
                </label>
                <div className="select-wrap">
                  <Select
                    id="default-format"
                    value={local.defaultFormat}
                    onChange={(event) =>
                      setLocal({
                        ...local,
                        defaultFormat: event.target.value as VideoFormat,
                      })
                    }
                  >
                    {['9:16', '16:9', '1:1'].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </Select>
                  <ChevronDown size={15} />
                </div>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="default-duration">
                  Тривалість
                </label>
                <div className="select-wrap">
                  <Select
                    id="default-duration"
                    value={local.defaultDuration}
                    onChange={(event) =>
                      setLocal({
                        ...local,
                        defaultDuration: Number(event.target.value),
                      })
                    }
                  >
                    {[15, 30, 45, 60].map((value) => (
                      <option key={value} value={value}>
                        {value} секунд
                      </option>
                    ))}
                  </Select>
                  <ChevronDown size={15} />
                </div>
              </div>
            </div>
            <div className="setting-line">
              <div>
                <strong>Автозбереження чернетки</strong>
                <p>Зберігати зміни у цьому браузері.</p>
              </div>
              <Toggle
                checked={local.autoSave}
                onChange={(autoSave) =>
                  setLocal({
                    ...local,
                    autoSave,
                  })
                }
                label="Автозбереження чернетки"
              />
            </div>
          </div>
        </section>
        <div className="settings-actions">
          <Button className="text-button danger-text" onClick={onReset}>
            Очистити дані студії
          </Button>
          <Button
            className="primary-button"
            onClick={() => {
              onSave(local)
              onToast('Налаштування збережено.')
            }}
          >
            <Check size={16} /> Зберегти налаштування
          </Button>
        </div>
      </div>
      <aside className="settings-aside">
        <h3>Резервна копія</h3>
        <div>
          <ShieldCheck size={17} />
          <span>Проєкти зберігаються тільки у твоєму браузері.</span>
        </div>
        <Button
          className="text-button"
          onClick={() => {
            const data = {
              preferences: local,
              projects: JSON.parse(localStorage.getItem('kadr-projects') || '[]'),
            }
            const blob = new Blob([JSON.stringify(data, null, 2)], {
              type: 'application/json',
            })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'kadr-backup.json'
            a.click()
            window.setTimeout(() => URL.revokeObjectURL(url), 1000)
            onToast('Резервну копію завантажено.')
          }}
        >
          <Download size={14} /> Завантажити резервну копію
        </Button>
      </aside>
    </div>
  )
}
