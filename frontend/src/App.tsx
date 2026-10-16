import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clapperboard,
  Download,
  FileJson,
  FileText,
  FolderOpen,
  Image,
  Menu,
  Plus,
  Search,
  Settings2,
  Upload,
  X,
} from 'lucide-react'
import {
  Brand,
  Button,
  Dialog,
  EmptyState,
  Input,
  Notice,
  Preview,
  ProjectCard,
  Select,
} from './ui-kit'
import { defaultDraft, mediaLibrary } from './data'
import { MediaPage, SettingsPage } from './Pages'
import { createSubtitles, downloadFile, useStoredState } from './storage'
import Studio from './Studio'
import type { Draft, MediaItem, Project, Settings, View } from './types'
type Modal =
  | {
      type: 'new'
    }
  | {
      type: 'preview'
    }
  | {
      type: 'rename'
      project: Project
    }
  | {
      type: 'delete'
      project: Project
    }
  | {
      type: 'reset'
    }
  | {
      type: 'result'
    }
const viewDetails: Record<View, string> = {
  studio: 'Створити відео',
  projects: 'Мої проєкти',
  media: 'Медіатека',
  settings: 'Налаштування',
}
const navItems = [
  {
    id: 'studio' as View,
    label: 'Створити відео',
    icon: Clapperboard,
  },
  {
    id: 'projects' as View,
    label: 'Мої проєкти',
    icon: FolderOpen,
  },
  {
    id: 'media' as View,
    label: 'Медіатека',
    icon: Image,
  },
]
function isDraft(item: unknown): item is Draft {
  if (!item || typeof item !== 'object') return false
  const value = item as Draft
  return (
    typeof value.topic === 'string' &&
    typeof value.script === 'string' &&
    ['9:16', '16:9', '1:1'].includes(value.format) &&
    [15, 30, 45, 60].includes(value.duration) &&
    ['Натхненний', 'Інформативний', 'Розмовний'].includes(value.tone) &&
    Array.isArray(value.mediaIds) &&
    value.mediaIds.every((id) => typeof id === 'string') &&
    Array.isArray(value.tags) &&
    value.tags.every((tag) => typeof tag === 'string') &&
    typeof value.voice === 'string' &&
    typeof value.music === 'string' &&
    typeof value.subtitles === 'boolean' &&
    typeof value.rate === 'number' &&
    value.rate >= 0.7 &&
    value.rate <= 1.3 &&
    typeof value.musicVolume === 'number'
  )
}

function readDraft(): Draft {
  try {
    const item = JSON.parse(localStorage.getItem('kadr-draft') || 'null') as Partial<Draft> | null
    if (isDraft(item))
      return {
        ...defaultDraft,
        ...item,
      }
  } catch {
    return {
      ...defaultDraft,
    }
  }
  return {
    ...defaultDraft,
  }
}

function readStoredProjects(): Project[] {
  try {
    const item = JSON.parse(localStorage.getItem('kadr-projects') || '[]')
    if (Array.isArray(item)) {
      return item as Project[]
    }
  } catch {
    return []
  }
  return []
}

export default function App() {
  const [view, setView] = useState<View>(() => {
    const hash = location.hash.slice(1) as View
    return Object.keys(viewDetails).includes(hash) ? hash : 'studio'
  })
  const [settings, setSettings] = useStoredState<Settings>(
    'kadr-settings',
    {
      autoSave: true,
      defaultDuration: 30,
      defaultFormat: '9:16',
    },
    (item) => {
      const value = item as Settings
      return (
        !!value &&
        typeof value.autoSave === 'boolean' &&
        [15, 30, 45, 60].includes(value.defaultDuration) &&
        ['9:16', '16:9', '1:1'].includes(value.defaultFormat)
      )
    }
  )
  const [projects, setProjects] = useState<Project[]>(readStoredProjects)
  
  useEffect(() => {
    try {
      localStorage.setItem('kadr-projects', JSON.stringify(projects))
    } catch (e) {
      console.error(e)
    }
  }, [projects])

  const [draft, setDraft] = useState<Draft>(readDraft)
  const [step, setStep] = useState(0)
  const [uploads, setUploads] = useState<MediaItem[]>([])
  const [modal, setModal] = useState<Modal | null>(null)
  const [modalInput, setModalInput] = useState('')
  const [toast, setToast] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 800px)').matches)
  const [projectMenu, setProjectMenu] = useState<string | null>(null)
  const [projectQuery, setProjectQuery] = useState('')
  const [projectFilter, setProjectFilter] = useState('all')
  const [projectSort, setProjectSort] = useState('recent')
  const toastTimer = useRef<number>(0)
  const objectUrls = useRef<string[]>([])
  const importRef = useRef<HTMLInputElement>(null)
  const allMedia = [...mediaLibrary, ...uploads]
  useEffect(() => {
    if (settings.autoSave) {
      try {
        localStorage.setItem('kadr-draft', JSON.stringify(draft))
      } catch {
        return
      }
    }
  }, [draft, settings.autoSave])
  useEffect(() => {
    const handleHash = () => {
      const hash = location.hash.slice(1) as View
      if (Object.keys(viewDetails).includes(hash)) {
        setView(hash)
        setSidebarOpen(false)
      }
    }
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 800px)')
    const resize = () => {
      setIsMobile(mediaQuery.matches)
      setSidebarOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false)
    }
    mediaQuery.addEventListener('change', resize)
    document.addEventListener('keydown', escape)
    return () => {
      mediaQuery.removeEventListener('change', resize)
      document.removeEventListener('keydown', escape)
    }
  }, [])
  useEffect(() => {
    document.title = `${viewDetails[view]} - Кадр`
    setProjectMenu(null)
  }, [view])
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.project-menu-wrap')) setProjectMenu(null)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])
  useEffect(
    () => () => {
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url))
      window.clearTimeout(toastTimer.current)
      if ('speechSynthesis' in window) speechSynthesis.cancel()
    },
    []
  )
  const notify = (message: string) => {
    window.clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = window.setTimeout(() => setToast(''), 5000)
  }
  const navigate = (target: View) => {
    setView(target)
    location.hash = target
    setSidebarOpen(false)
    window.scrollTo({
      top: 0,
      behavior: 'instant',
    })
    if ('speechSynthesis' in window) speechSynthesis.cancel()
  }
  const updateDraft = (patch: Partial<Draft>) =>
    setDraft((current) => ({
      ...current,
      ...patch,
    }))
  const saveProject = (status: 'draft' | 'ready' = 'draft', silent = false) => {
    if (draft.topic.trim().length < 5) {
      if (!silent) notify('Додай тему відео перед збереженням.')
      return
    }
    const now = new Date().toISOString()
    const id = draft.id || crypto.randomUUID()
    
    setProjects((current) => {
      const existing = current.find((project) => project.id === id)
      const project: Project = {
        ...draft,
        id,
        title: existing?.title || draft.topic.trim().slice(0, 70),
        status,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      }
      return [project, ...current.filter((item) => item.id !== id)]
    })

    updateDraft({ id })
    if (!silent)
      notify(status === 'ready' ? 'Проєкт збережено.' : 'Чернетку збережено в цьому браузері.')
  }
  const startNew = () => {
    setModalInput('')
    setModal({
      type: 'new',
    })
  }
  const createNew = () => {
    if (draft.topic.trim().length >= 5) saveProject('draft', true)
    setDraft({
      ...defaultDraft,
      topic: modalInput.trim(),
      duration: settings.defaultDuration,
      format: settings.defaultFormat,
    })
    setStep(0)
    setModal(null)
    navigate('studio')
    notify('Проєкт створено.')
  }
  const openProject = (project: Project) => {
    const availableIds = project.mediaIds.filter((id) => allMedia.some((item) => item.id === id))
    if (availableIds.length !== project.mediaIds.length)
      notify('Додай власні файли повторно: вони не зберігаються між сеансами.')
    setDraft({
      ...project,
      mediaIds: availableIds,
    })
    setStep(0)
    navigate('studio')
  }
  const exportProject = (project: Draft | Project) => {
    const {
      id,
      topic,
      format,
      duration,
      tone,
      script,
      tags,
      voice,
      rate,
      music,
      musicVolume,
      subtitles,
      mediaIds,
    } = project
    const config = {
      version: 1,
      mode: 'frontend',
      language: 'uk',
      id,
      title: 'title' in project ? project.title : topic,
      topic,
      format,
      duration,
      tone,
      script,
      search_terms: tags,
      voice: {
        name: voice,
        provider: 'edge-tts',
        rate,
      },
      music: {
        name: music,
        volume: musicVolume,
      },
      subtitles,
      media: mediaIds.map((mediaId) => {
        const item = allMedia.find((entry) => entry.id === mediaId)
        return {
          id: mediaId,
          name: item?.name || 'Власний матеріал',
          type: item?.type || 'unknown',
          requires_upload: !!item?.local || !item,
        }
      }),
      output: {
        resolution:
          format === '9:16' ? [1080, 1920] : format === '16:9' ? [1920, 1080] : [1080, 1080],
        fps: 24,
        format: 'mp4',
      },
    }
    downloadFile(
      JSON.stringify(config, null, 2),
      `kadr-${id || 'project'}.json`,
      'application/json'
    )
    notify('Налаштування проєкту завантажено у JSON.')
  }
  const importProjects = async (file: File | undefined) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      notify('JSON-файл має бути меншим за 10 МБ.')
      return
    }
    try {
      const data = JSON.parse(await file.text())
      const now = new Date().toISOString()
      let imported: Project[] = []
      if (data && Array.isArray(data.projects)) {
        imported = data.projects.map((project: Project) => ({
          ...project,
          id: crypto.randomUUID(),
          title: (project.title || 'Імпортований проєкт').slice(0, 70),
          updatedAt: now,
        }))
      } else if (data?.version === 1 && typeof data.topic === 'string') {
        imported = [
          {
            ...defaultDraft,
            ...data,
            id: crypto.randomUUID(),
            title: (data.title || data.topic).slice(0, 70),
            status: 'draft',
            createdAt: now,
            updatedAt: now,
          },
        ]
      } else throw new Error('Unsupported file')
      
      setProjects((current) => [...imported, ...current])
      notify(`Імпортовано проєктів: ${imported.length}.`)
    } catch {
      notify('Не вдалося прочитати файл.')
    }
  }
  const handleGenerateVideo = async () => {
    notify('Завдання на генерацію відео відправлено на сервер...')

    try {
      const response = await fetch('http://127.0.0.1:8000/api/generate-video/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: draft.topic,
          script: draft.script,
          format: draft.format,
          duration: draft.duration,
          tone: draft.tone,
          voice: draft.voice,
          rate: draft.rate,
          music: draft.music,
          media_ids: draft.mediaIds,
          subtitles: draft.subtitles,
        }),
      })

      if (!response.ok) {
        throw new Error('Помилка сервера при генерації')
      }

      const data = await response.json()
      
      const now = new Date().toISOString()
      const newId = draft.id || crypto.randomUUID()
      const actualDuration = data.duration || draft.duration
      
      const finishedProject: Project = {
        ...draft,
        id: newId,
        audioUrl: data.audio_url,
        duration: actualDuration,
        title: draft.topic.trim().slice(0, 70) || 'Новий проєкт',
        status: 'ready',
        createdAt: now,
        updatedAt: now,
      }

      updateDraft({ 
        id: newId, 
        audioUrl: data.audio_url,
        duration: actualDuration
      })

      setProjects((current) => [finishedProject, ...current.filter(p => p.id !== newId)])
      
      notify(`Відео успішно згенеровано! ID проєкту: ${data.project_id}`)
      setModal({ type: 'result' })

    } catch (error) {
      console.error(error)
      notify('Не вдалося згенерувати відео. Перевір бекенд.')
    }
  }
  const projectAction = (
    project: Project,
    action: 'rename' | 'duplicate' | 'export' | 'delete'
  ) => {
    setProjectMenu(null)
    if (action === 'rename') {
      setModalInput(project.title)
      setModal({
        type: 'rename',
        project,
      })
    }
    if (action === 'delete')
      setModal({
        type: 'delete',
        project,
      })
    if (action === 'export') exportProject(project)
    if (action === 'duplicate') {
      const now = new Date().toISOString()
      const duplicatedProject: Project = {
        ...project,
        id: crypto.randomUUID(),
        title: `${project.title} - копія`,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      }
      setProjects((current) => [duplicatedProject, ...current])
      notify('Копію додано до твоїх проєктів.')
    }
  }
  const uploadFiles = (files: FileList | null) => {
    if (!files?.length) return
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'audio/wav',
      'audio/x-wav',
    ]
    const added: MediaItem[] = []
    let rejected = 0
    for (const file of Array.from(files)) {
      if (!allowed.includes(file.type) || file.size > 50 * 1024 * 1024 || file.size === 0) {
        rejected++
        continue
      }
      const url = URL.createObjectURL(file)
      objectUrls.current.push(url)
      const type = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
          ? 'video'
          : 'audio'
      added.push({
        id: crypto.randomUUID(),
        name: file.name,
        image: type === 'image' ? url : '',
        url,
        type,
        category: 'Власні матеріали',
        tags: [file.name.toLowerCase()],
        local: true,
      })
    }
    setUploads((current) => [...current, ...added])
    if (added.length)
      updateDraft({
        mediaIds: [
          ...draft.mediaIds,
          ...added.filter((item) => item.type !== 'audio').map((item) => item.id),
        ],
      })
    notify(
      `${added.length ? `Додано матеріалів: ${added.length}.` : ''}${rejected ? ' Деякі файли не підтримуються, порожні або більші за 50 МБ.' : ''}`.trim()
    )
  }
  const removeUpload = (id: string) => {
    const item = uploads.find((entry) => entry.id === id)
    if (item?.url) {
      URL.revokeObjectURL(item.url)
      objectUrls.current = objectUrls.current.filter((url) => url !== item.url)
    }
    setUploads((current) => current.filter((entry) => entry.id !== id))
    updateDraft({
      mediaIds: draft.mediaIds.filter((value) => value !== id),
    })
    notify('Матеріал видалено з поточного сеансу.')
  }
  const sortedProjects = [...projects]
    .filter(
      (project) =>
        (projectFilter === 'all' || project.status === projectFilter) &&
        `${project.title || ''} ${project.topic || ''}`.toLowerCase().includes(projectQuery.toLowerCase())
    )
    .sort((a, b) =>
      projectSort === 'name'
        ? (a.title || '').localeCompare(b.title || '', 'uk')
        : new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
    )
  const projectCards = (items: Project[]) =>
    items.map((project) => (
      <ProjectCard
        key={project.id}
        project={project}
        media={allMedia}
        onOpen={() => openProject(project)}
        onMenu={() => setProjectMenu((current) => (current === project.id ? null : project.id))}
        menuOpen={projectMenu === project.id}
        onAction={(action) => projectAction(project, action)}
      />
    ))
  return (
    <div className="app-shell">
      {sidebarOpen && (
        <Button
          className="sidebar-scrim"
          aria-label="Закрити навігацію"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        id="studio-navigation"
        inert={isMobile && !sidebarOpen}
        className={`sidebar ${sidebarOpen ? 'open' : ''}`}
      >
        <Button
          className="brand-link"
          aria-label="Кадр - головна"
          onClick={() => navigate('studio')}
        >
          <Brand />
        </Button>
        <nav className="main-nav" aria-label="Головна навігація">
          {navItems.map((item) => (
            <Button
              key={item.id}
              className={view === item.id ? 'active' : ''}
              onClick={() => navigate(item.id)}
            >
              <item.icon size={19} strokeWidth={1.6} />
              <span>{item.label}</span>
              {item.id === 'projects' && <span className="nav-count">{projects.length}</span>}
            </Button>
          ))}
        </nav>
        <nav className="secondary-nav" aria-label="Налаштування">
          <Button
            className={view === 'settings' ? 'active' : ''}
            onClick={() => navigate('settings')}
          >
            <Settings2 size={18} strokeWidth={1.6} /> Налаштування
          </Button>
        </nav>
      </aside>
      <div className="main-shell">
        <header className="mobile-topbar">
          <Button
            className="icon-button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Відкрити навігацію"
            aria-expanded={sidebarOpen}
            aria-controls="studio-navigation"
          >
            <Menu size={22} />
          </Button>
          <span>Кадр</span>
        </header>
        <main>
          {view !== 'studio' && (
            <div className="page-heading">
              <h1>{viewDetails[view]}</h1>
              {view === 'projects' && (
                <Button className="new-project-button" onClick={startNew}>
                  <Plus size={17} /> Новий проєкт
                </Button>
              )}
            </div>
          )}
          {view === 'studio' && (
            <Studio
              draft={draft}
              updateDraft={updateDraft}
              step={step}
              onStep={setStep}
              media={allMedia}
              onUpload={uploadFiles}
              onSave={() => saveProject()}
              onGenerate={handleGenerateVideo}
              onExpand={() =>
                setModal({
                  type: 'preview',
                })
              }
              onToast={notify}
            />
          )}
          {view === 'projects' && (
            <>
              <div className="list-toolbar">
                <div className="filter-tabs">
                  {[
                    ['all', 'Усі'],
                    ['ready', 'Збережені'],
                    ['draft', 'Чернетки'],
                  ].map(([id, name]) => (
                    <Button
                      key={id}
                      className={projectFilter === id ? 'active' : ''}
                      onClick={() => setProjectFilter(id)}
                    >
                      {name}
                      <span>
                        {projects.filter((item) => id === 'all' || item.status === id).length}
                      </span>
                    </Button>
                  ))}
                </div>
                <div className="project-list-controls">
                  <div className="search-field">
                    <Search size={16} />
                    <Input
                      aria-label="Пошук проєктів"
                      value={projectQuery}
                      onChange={(event) => setProjectQuery(event.target.value)}
                      placeholder="Знайти проєкт"
                    />
                    {projectQuery && (
                      <Button
                        className="icon-button"
                        aria-label="Очистити пошук проєктів"
                        onClick={() => setProjectQuery('')}
                      >
                        <X size={14} />
                      </Button>
                    )}
                  </div>
                  <div className="select-wrap sort-select">
                    <Select
                      aria-label="Сортування проєктів"
                      value={projectSort}
                      onChange={(event) => setProjectSort(event.target.value)}
                    >
                      <option value="recent">Спочатку нові</option>
                      <option value="name">За назвою</option>
                    </Select>
                    <ChevronDown size={14} />
                  </div>
                  <Button
                    className="icon-button import-button"
                    aria-label="Імпортувати проєкти з JSON"
                    title="Імпортувати JSON"
                    onClick={() => importRef.current?.click()}
                  >
                    <Upload size={17} />
                  </Button>
                  <Input
                    ref={importRef}
                    hidden
                    type="file"
                    accept=".json,application/json"
                    onChange={(event) => {
                      void importProjects(event.target.files?.[0])
                      event.target.value = ''
                    }}
                  />
                </div>
              </div>
              <div className="project-grid all-projects">{projectCards(sortedProjects)}</div>
              {!sortedProjects.length && (
                <EmptyState>
                  <FolderOpen size={38} />
                  <h3>{projectQuery ? 'Проєктів не знайдено' : 'Проєктів ще немає'}</h3>
                  <Button
                    className="primary-button"
                    onClick={
                      projectQuery
                        ? () => {
                            setProjectQuery('')
                            setProjectFilter('all')
                          }
                        : startNew
                    }
                  >
                    {projectQuery ? 'Скинути пошук' : 'Створити проєкт'}
                    <ArrowRight size={15} />
                  </Button>
                </EmptyState>
              )}
            </>
          )}
          {view === 'media' && (
            <MediaPage
              media={allMedia}
              selectedIds={draft.mediaIds}
              onToggle={(id) =>
                updateDraft({
                  mediaIds: draft.mediaIds.includes(id)
                    ? draft.mediaIds.filter((item) => item !== id)
                    : [...draft.mediaIds, id],
                })
              }
              onUpload={uploadFiles}
              onRemove={removeUpload}
              onStudio={() => {
                setStep(3)
                navigate('studio')
              }}
            />
          )}
          {view === 'settings' && (
            <SettingsPage
              settings={settings}
              onSave={setSettings}
              onToast={notify}
              onReset={() =>
                setModal({
                  type: 'reset',
                })
              }
            />
          )}
        </main>
      </div>
      {toast && (
        <Notice className="toast" role="status">
          <span className="toast-check">
            <Check size={15} />
          </span>
          <p>{toast}</p>
          <Button
            className="icon-button"
            aria-label="Закрити повідомлення"
            onClick={() => setToast('')}
          >
            <X size={15} />
          </Button>
        </Notice>
      )}
      {modal?.type === 'new' && (
        <Dialog title="Новий проєкт" onClose={() => setModal(null)}>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              createNew()
            }}
          >
            <label className="field-label" htmlFor="new-topic">
              Тема відео <span className="optional">необов’язково</span>
            </label>
            <Input
              className="full-input"
              id="new-topic"
              maxLength={500}
              value={modalInput}
              onChange={(event) => setModalInput(event.target.value)}
              placeholder="Введи тему"
              autoFocus
            />
            <div className="dialog-actions">
              <Button className="secondary-button" type="button" onClick={() => setModal(null)}>
                Скасувати
              </Button>
              <Button className="primary-button" type="submit">
                Створити проєкт
              </Button>
            </div>
          </form>
        </Dialog>
      )}
      {modal?.type === 'preview' && (
        <Dialog title="Попередній перегляд" onClose={() => setModal(null)} wide>
          <Preview draft={draft} media={allMedia} expanded />
        </Dialog>
      )}
      {modal?.type === 'rename' && (
        <Dialog title="Перейменувати проєкт" onClose={() => setModal(null)}>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              if (!modalInput.trim()) return
              setProjects((current) =>
                current.map((project) =>
                  project.id === modal.project.id
                    ? {
                        ...project,
                        title: modalInput.trim(),
                        updatedAt: new Date().toISOString(),
                      }
                    : project
                )
              )
              setModal(null)
              notify('Назву проєкту оновлено.')
            }}
          >
            <label className="field-label" htmlFor="project-title">
              Назва проєкту
            </label>
            <Input
              className="full-input"
              id="project-title"
              maxLength={70}
              required
              value={modalInput}
              onChange={(event) => setModalInput(event.target.value)}
              autoFocus
            />
            <div className="dialog-actions">
              <Button className="secondary-button" type="button" onClick={() => setModal(null)}>
                Скасувати
              </Button>
              <Button className="primary-button" type="submit" disabled={!modalInput.trim()}>
                Зберегти назву
              </Button>
            </div>
          </form>
        </Dialog>
      )}
      {modal?.type === 'delete' && (
        <Dialog title="Видалити проєкт?" onClose={() => setModal(null)}>
          <p className="dialog-copy">
            Проєкт «{modal.project.title}» буде видалено з цього браузера.
          </p>
          <div className="dialog-actions">
            <Button className="secondary-button" onClick={() => setModal(null)}>
              Скасувати
            </Button>
            <Button
              className="danger-button"
              onClick={() => {
                setProjects((current) => current.filter((item) => item.id !== modal.project.id))
                if (draft.id === modal.project.id)
                  setDraft({
                    ...defaultDraft,
                  })
                setModal(null)
                notify('Проєкт видалено.')
              }}
            >
              Видалити
            </Button>
          </div>
        </Dialog>
      )}
      {modal?.type === 'reset' && (
        <Dialog title="Очистити дані?" onClose={() => setModal(null)}>
          <p className="dialog-copy">
            Проєкти, чернетки й налаштування буде видалено з цього браузера. Перед очищенням збережи
            резервну копію.
          </p>
          <div className="dialog-actions">
            <Button className="secondary-button" onClick={() => setModal(null)}>
              Скасувати
            </Button>
            <Button
              className="danger-button"
              onClick={() => {
                setProjects([])
                setDraft({
                  ...defaultDraft,
                })
                setSettings({
                  autoSave: true,
                  defaultDuration: 30,
                  defaultFormat: '9:16',
                })
                objectUrls.current.forEach((url) => URL.revokeObjectURL(url))
                objectUrls.current = []
                setUploads([])
                localStorage.removeItem('kadr-draft')
                localStorage.removeItem('kadr-projects')
                setModal(null)
                notify('Дані очищено.')
              }}
            >
              Очистити дані
            </Button>
          </div>
        </Dialog>
      )}
      {modal?.type === 'result' && (
        <Dialog title="Проєкт збережено" onClose={() => setModal(null)}>
          <div className="result-summary">
            <strong>{draft.topic}</strong>
            <span>
              {draft.format} · {draft.duration} с · {draft.mediaIds.length} матеріали
            </span>
          </div>
          <div className="export-options">
            <Button onClick={() => exportProject(draft)}>
              <FileJson size={20} />
              <div>
                <strong>Проєкт</strong>
                <span>JSON</span>
              </div>
              <Download size={16} />
            </Button>
            <Button
              onClick={() => {
                downloadFile(
                  createSubtitles(draft.script, draft.duration),
                  'kadr-subtitles.srt',
                  'text/plain;charset=utf-8'
                )
                notify('Субтитри завантажено. Час розподілено рівномірно.')
              }}
            >
              <FileText size={20} />
              <div>
                <strong>Субтитри</strong>
                <span>SRT</span>
              </div>
              <Download size={16} />
            </Button>
          </div>
          <p className="field-help">MP4 стане доступним після підключення серверної обробки.</p>
          <div className="dialog-actions">
            <Button className="secondary-button" onClick={() => setModal(null)}>
              До редактора
            </Button>
            <Button
              className="primary-button"
              onClick={() => {
                setModal(null)
                navigate('projects')
              }}
            >
              Мої проєкти <ArrowRight size={15} />
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  )
}