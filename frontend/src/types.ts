export type View = 'studio' | 'projects' | 'media' | 'settings'
export type VideoFormat = '9:16' | '16:9' | '1:1'
export type ProjectStatus = 'draft' | 'ready'
export type Tone = 'Натхненний' | 'Інформативний' | 'Розмовний'

export interface Draft {
  id: string | null
  topic: string
  format: VideoFormat
  duration: number
  tone: Tone
  script: string
  tags: string[]
  voice: string
  rate: number
  music: string
  musicVolume: number
  subtitles: boolean
  mediaIds: string[]
  audioUrl?: string
}

export interface Project extends Draft {
  id: string
  title: string
  status: ProjectStatus
  createdAt: string
  updatedAt: string
}

export interface MediaItem {
  id: string
  name: string
  image: string
  type: 'image' | 'video' | 'audio'
  category: string
  tags: string[]
  duration?: number
  local?: boolean
  url?: string
}

export interface Settings {
  autoSave: boolean
  defaultDuration: number
  defaultFormat: VideoFormat
}
