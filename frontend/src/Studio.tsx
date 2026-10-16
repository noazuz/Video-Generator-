import { useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Copy,
  FileText,
  Film,
  ImagePlus,
  Maximize2,
  Mic2,
  Music2,
  Play,
  Search,
  SlidersHorizontal,
  Upload,
  Volume2,
} from 'lucide-react'
import {
  Button,
  Field,
  FormatChoice,
  Input,
  MediaCard,
  Preview,
  Select,
  StepNavigation,
  Textarea,
  Toggle,
} from './ui-kit'
import { createScriptTemplate, steps } from './data'
import type { Draft, MediaItem, Tone } from './types'
interface StudioProps {
  draft: Draft
  updateDraft: (patch: Partial<Draft>) => void
  step: number
  onStep: (step: number) => void
  media: MediaItem[]
  onUpload: (files: FileList | null) => void
  onSave: () => void
  onGenerate: () => void
  onExpand: () => void
  onToast: (message: string) => void
}
export default function Studio({
  draft,
  updateDraft,
  step,
  onStep,
  media,
  onUpload,
  onSave,
  onGenerate,
  onExpand,
  onToast,
}: StudioProps) {
  const [mediaQuery, setMediaQuery] = useState('')
  const [mediaSource, setMediaSource] = useState('library')
  const [tagInput, setTagInput] = useState('')
  const [voicePlaying, setVoicePlaying] = useState(false)
  const [topicError, setTopicError] = useState(false)
  const uploadRef = useRef<HTMLInputElement>(null)
  const topicRef = useRef<HTMLTextAreaElement>(null)
  const validateTopic = () => {
    if (draft.topic.trim().length < 5) {
      setTopicError(true)
      onStep(0)
      window.setTimeout(() => topicRef.current?.focus(), 50)
      onToast('Опиши тему хоча б п’ятьма символами.')
      return false
    }
    setTopicError(false)
    return true
  }
  const generateScript = () => {
    if (!validateTopic()) return
    const result = createScriptTemplate(draft.topic, draft.tone, draft.duration)
    updateDraft(result)
    onToast('Шаблон сценарію створено.')
  }
  const nextStep = () => {
    if (!validateTopic()) return
    if (step === 0 && !draft.script.trim())
      updateDraft(createScriptTemplate(draft.topic, draft.tone, draft.duration))
    if (step === 1 && !draft.script.trim()) {
      onToast('Додай текст сценарію, щоб перейти до озвучки.')
      return
    }
    if (step === 3) {
      if (!draft.script.trim()) {
        onToast('Додай текст сценарію.')
        onStep(1)
        return
      }
      if (
        !draft.mediaIds.some((id) => media.some((item) => item.id === id && item.type !== 'audio'))
      ) {
        onToast('Обери хоча б один візуальний матеріал.')
        return
      }
      onGenerate()
    } else onStep(step + 1)
  }
  const selectStep = (target: number) => {
    if (target > 0 && !validateTopic()) return
    if (target > 1 && !draft.script.trim()) {
      onToast('Спочатку додай сценарій.')
      onStep(1)
      return
    }
    onStep(target)
  }
  const toggleMedia = (id: string) =>
    updateDraft({
      mediaIds: draft.mediaIds.includes(id)
        ? draft.mediaIds.filter((item) => item !== id)
        : [...draft.mediaIds, id],
    })
  const previewVoice = () => {
    if (!('speechSynthesis' in window)) {
      onToast('Цей браузер не підтримує зразок озвучки.')
      return
    }
    if (voicePlaying) {
      speechSynthesis.cancel()
      setVoicePlaying(false)
      return
    }
    const voices = speechSynthesis
      .getVoices()
      .filter((voice) => voice.lang.toLowerCase().startsWith('uk'))
    if (!voices.length) {
      onToast(
        'У браузері немає українського голосу. Зразок Edge-TTS буде доступний після підключення сервера.'
      )
      return
    }
    const utterance = new SpeechSynthesisUtterance(
      draft.script || 'Приклад українського озвучення.'
    )
    utterance.lang = 'uk-UA'
    utterance.rate = draft.rate
    utterance.voice = voices[draft.voice === 'Поліна' ? Math.min(1, voices.length - 1) : 0]
    utterance.onend = () => setVoicePlaying(false)
    utterance.onerror = () => setVoicePlaying(false)
    speechSynthesis.cancel()
    speechSynthesis.speak(utterance)
    setVoicePlaying(true)
  }
  const visibleMedia = media.filter(
    (item) =>
      item.type !== 'audio' &&
      (mediaSource === 'own' ? item.local : !item.local) &&
      `${item.name} ${item.tags.join(' ')}`.toLowerCase().includes(mediaQuery.toLowerCase())
  )
  const wordCount = draft.script.trim().split(/\s+/).filter(Boolean).length
  return (
    <>
      <div className="studio-grid">
        <section className="editor-card" aria-label="Редактор відеопроєкту">
          <div className="editor-heading">
            <div className="editor-label">
              <span className="orange-icon">
                <Film size={17} />
              </span>
              <h1>Створити відео</h1>
            </div>
            <span className="editor-step-count">Крок {step + 1} з 4</span>
          </div>
          <StepNavigation
            labels={steps.map((item) => item.title)}
            current={step}
            onChange={selectStep}
          />
          <div className="editor-content">
            {step === 0 && (
              <div className="step-content">
                <Field
                  label="Тема відео"
                  id="topic"
                  required
                  error={topicError ? 'Введи щонайменше 5 символів.' : undefined}
                >
                  <div className={`topic-field ${topicError ? 'invalid' : ''}`}>
                    <Textarea
                      id="topic"
                      ref={topicRef}
                      maxLength={500}
                      value={draft.topic}
                      onChange={(event) => {
                        updateDraft({
                          topic: event.target.value,
                          script: '',
                        })
                        setTopicError(false)
                      }}
                      placeholder="Наприклад, подорож у Карпати"
                    />
                    <span className="field-count">{draft.topic.length} / 500</span>
                  </div>
                </Field>
                <div className="field-divider" />
                <FormatChoice
                  value={draft.format}
                  onChange={(format) =>
                    updateDraft({
                      format,
                    })
                  }
                />
                <div className="field-row">
                  <div className="field">
                    <label className="field-label" htmlFor="duration">
                      Тривалість
                    </label>
                    <div className="select-wrap">
                      <Select
                        id="duration"
                        value={draft.duration}
                        onChange={(event) =>
                          updateDraft({
                            duration: Number(event.target.value),
                            script: '',
                          })
                        }
                      >
                        {[15, 30, 45, 60].map((duration) => (
                          <option key={duration} value={duration}>
                            {duration} секунд
                          </option>
                        ))}
                      </Select>
                      <ChevronDown size={15} />
                    </div>
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="tone">
                      Стиль сценарію
                    </label>
                    <div className="select-wrap">
                      <Select
                        id="tone"
                        value={draft.tone}
                        onChange={(event) =>
                          updateDraft({
                            tone: event.target.value as Tone,
                            script: '',
                          })
                        }
                      >
                        {['Натхненний', 'Інформативний', 'Розмовний'].map((tone) => (
                          <option key={tone}>{tone}</option>
                        ))}
                      </Select>
                      <ChevronDown size={15} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            {step === 1 && (
              <div className="step-content">
                <div className="section-title with-action">
                  <div>
                    <h3>Сценарій</h3>
                  </div>
                </div>
                <div className="script-meta">
                  <span>
                    <FileText size={13} /> Текст сценарію
                  </span>
                  <Button
                    className="text-button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(draft.script)
                        onToast('Сценарій скопійовано.')
                      } catch {
                        onToast('Не вдалося скопіювати. Виділи текст сценарію вручну.')
                      }
                    }}
                  >
                    <Copy size={13} /> Копіювати
                  </Button>
                </div>
                <Textarea
                  className="script-editor"
                  aria-label="Текст сценарію"
                  maxLength={3000}
                  value={draft.script}
                  onChange={(event) =>
                    updateDraft({
                      script: event.target.value,
                    })
                  }
                  placeholder="Введи текст сценарію"
                />
                <div className="script-bottom">
                  <span>
                    {wordCount} слів · орієнтовно{' '}
                    {Math.max(1, Math.round(wordCount / (2.4 * draft.rate)))} с озвучки
                  </span>
                  <span>{draft.script.length} / 3000</span>
                </div>
                <Button className="secondary-button generate-script" onClick={generateScript}>
                  <FileText size={15} /> Заповнити за шаблоном
                </Button>
                <div className="field-divider" />
                <label className="field-label" htmlFor="tag-input">
                  Ключові слова для пошуку матеріалів
                </label>
                <p className="field-help">Англійські слова допоможуть точніше підібрати кадри.</p>
                <div className="tags">
                  {draft.tags.map((tag) => (
                    <Button
                      key={tag}
                      onClick={() =>
                        updateDraft({
                          tags: draft.tags.filter((value) => value !== tag),
                        })
                      }
                      aria-label={`Прибрати ключове слово ${tag}`}
                    >
                      {tag}
                      <span>×</span>
                    </Button>
                  ))}
                </div>
                <form
                  className="tag-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    const tag = tagInput.trim().toLowerCase()
                    if (tag && !draft.tags.includes(tag) && draft.tags.length < 10) {
                      updateDraft({
                        tags: [...draft.tags, tag],
                      })
                      setTagInput('')
                    }
                  }}
                >
                  <Input
                    id="tag-input"
                    maxLength={40}
                    value={tagInput}
                    onChange={(event) => setTagInput(event.target.value)}
                    placeholder="Додати ключове слово…"
                  />
                  <Button className="text-button" type="submit">
                    Додати
                  </Button>
                </form>
              </div>
            )}
            {step === 2 && (
              <div className="step-content">
                <div className="section-title">
                  <h3>Озвучення</h3>
                </div>
                <label className="field-label">Голос озвучки</label>
                <div className="voice-options">
                  {[
                    {
                      name: 'Остап',
                      label: 'Чоловічий · спокійний',
                      initials: 'О',
                      color: 'sage',
                    },
                    {
                      name: 'Поліна',
                      label: 'Жіночий · природний',
                      initials: 'П',
                      color: 'peach',
                    },
                  ].map((voice) => (
                    <Button
                      key={voice.name}
                      className={`voice-option ${draft.voice === voice.name ? 'selected' : ''}`}
                      aria-pressed={draft.voice === voice.name}
                      onClick={() =>
                        updateDraft({
                          voice: voice.name,
                        })
                      }
                    >
                      <span className={`voice-avatar ${voice.color}`}>
                        <Mic2 size={21} />
                      </span>
                      <div>
                        <strong>{voice.name}</strong>
                        <small>{voice.label}</small>
                      </div>
                      <span className="radio-mark">{draft.voice === voice.name && <i />}</span>
                    </Button>
                  ))}
                </div>
                <Button className="secondary-button voice-sample" onClick={previewVoice}>
                  <Play size={14} fill="currentColor" />
                  {voicePlaying ? 'Зупинити зразок' : 'Послухати зразок у браузері'}
                  <span className="waveform small">
                    {Array.from(
                      {
                        length: 15,
                      },
                      (_, i) => (
                        <span
                          key={i}
                          style={{
                            height: `${5 + ((i * 7) % 16)}px`,
                          }}
                        />
                      )
                    )}
                  </span>
                </Button>
                <div className="range-label">
                  <label className="field-label" htmlFor="voice-rate">
                    Швидкість мовлення
                  </label>
                  <strong>{draft.rate.toFixed(1)}×</strong>
                </div>
                <Input
                  className="setting-range"
                  id="voice-rate"
                  type="range"
                  min="0.7"
                  max="1.3"
                  step="0.1"
                  value={draft.rate}
                  onChange={(event) =>
                    updateDraft({
                      rate: Number(event.target.value),
                    })
                  }
                />
                <div className="range-ends">
                  <span>Повільніше</span>
                  <span>Швидше</span>
                </div>
                <div className="field-divider" />
                <label className="field-label" htmlFor="music">
                  Фонова музика
                </label>
                <div className="select-wrap leading-icon">
                  <Music2 size={16} />
                  <Select
                    id="music"
                    value={draft.music}
                    onChange={(event) =>
                      updateDraft({
                        music: event.target.value,
                      })
                    }
                  >
                    {[
                      'Без музики',
                      'Спокійна атмосфера',
                      'Натхненний ритм',
                      'Легкий акустичний фон',
                    ].map((name) => (
                      <option key={name}>{name}</option>
                    ))}
                  </Select>
                  <ChevronDown size={15} />
                </div>
                {draft.music !== 'Без музики' && (
                  <>
                    <div className="range-label music-range-label">
                      <label className="field-label" htmlFor="music-volume">
                        <Volume2 size={13} /> Гучність музики
                      </label>
                      <strong>{draft.musicVolume}%</strong>
                    </div>
                    <Input
                      className="setting-range"
                      id="music-volume"
                      type="range"
                      min="0"
                      max="100"
                      value={draft.musicVolume}
                      onChange={(event) =>
                        updateDraft({
                          musicVolume: Number(event.target.value),
                        })
                      }
                    />
                  </>
                )}
                <div className="setting-line">
                  <div>
                    <strong>Субтитри</strong>
                  </div>
                  <Toggle
                    checked={draft.subtitles}
                    onChange={(value) =>
                      updateDraft({
                        subtitles: value,
                      })
                    }
                    label="Субтитри"
                  />
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="step-content">
                <div className="section-title">
                  <h3>Медіаматеріали</h3>
                </div>
                <div className="source-tabs">
                  <Button
                    className={mediaSource === 'library' ? 'active' : ''}
                    onClick={() => setMediaSource('library')}
                  >
                    <Search size={14} /> Добірка фото
                  </Button>
                  <Button
                    className={mediaSource === 'own' ? 'active' : ''}
                    onClick={() => setMediaSource('own')}
                  >
                    <Upload size={14} /> Мої матеріали
                  </Button>
                </div>
                <div className="search-field">
                  <Search size={16} />
                  <Input
                    aria-label="Пошук кадрів"
                    value={mediaQuery}
                    onChange={(event) => setMediaQuery(event.target.value)}
                    placeholder="Гори, море, місто…"
                  />
                </div>
                <div className="selection-summary">
                  <span>
                    Обрано:{' '}
                    <strong>
                      {draft.mediaIds.filter((id) => media.some((item) => item.id === id)).length}{' '}
                      матеріали
                    </strong>
                  </span>
                  <Button
                    className="text-button"
                    onClick={() =>
                      updateDraft({
                        mediaIds: [],
                      })
                    }
                  >
                    Скинути
                  </Button>
                </div>
                <div className="editor-media-grid">
                  {visibleMedia.map((item) => (
                    <MediaCard
                      key={item.id}
                      item={item}
                      selected={draft.mediaIds.includes(item.id)}
                      onSelect={() => toggleMedia(item.id)}
                    />
                  ))}
                </div>
                {!visibleMedia.length && (
                  <div className="small-empty">
                    <ImagePlus size={28} />
                    <p>
                      {mediaSource === 'own'
                        ? 'Додай власні фото або відео.'
                        : 'За цим запитом немає матеріалів.'}
                    </p>
                  </div>
                )}
                <Input
                  ref={uploadRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,audio/mpeg,audio/wav"
                  multiple
                  hidden
                  onChange={(event) => {
                    onUpload(event.target.files)
                    event.target.value = ''
                  }}
                />
                <Button className="upload-inline" onClick={() => uploadRef.current?.click()}>
                  <Upload size={17} />
                  <span>Завантажити свої матеріали</span>
                  <small>Фото, відео або аудіо · до 50 МБ</small>
                </Button>
                <div className="export-summary">
                  <SlidersHorizontal size={16} />
                  <span>
                    {draft.format} · {draft.duration} с · 24 кадри/с
                  </span>
                  <span>HD</span>
                </div>
              </div>
            )}
          </div>
          <div className="editor-footer">
            <Button className="secondary-button" onClick={step ? () => onStep(step - 1) : onSave}>
              {step ? <ArrowLeft size={15} /> : <FileText size={15} />}
              {step ? 'Назад' : 'Зберегти чернетку'}
            </Button>
            <Button className="primary-button" onClick={nextStep}>
              {step === 3 ? (
                <>
                  <Film size={16} /> Завершити
                </>
              ) : (
                <>
                  {step === 0 ? 'До сценарію' : 'Наступний крок'}
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </div>
        </section>
        <aside className="preview-panel">
          <div className="preview-heading">
            <h2>Попередній перегляд</h2>
            {draft.audioUrl && (
              <Button
                className="icon-button"
                aria-label="Розгорнути попередній перегляд"
                onClick={onExpand}
              >
                <Maximize2 size={17} />
              </Button>
            )}
          </div>
          {draft.audioUrl ? (
            <Preview draft={draft} media={media} />
          ) : (
            <div className="preview-empty-state" style={{ padding: '80px 20px', textAlign: 'center', color: '#888' }}>
              <Film size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ fontWeight: 500, marginBottom: '4px' }}>Попередній перегляд порожній</p>
              <p style={{ fontSize: '13px', opacity: 0.7 }}>Згенеруй відео або відкрий готовий проєкт із розділу «Мої проєкти»</p>
            </div>
          )}
        </aside>
      </div>
    </>
  )
}