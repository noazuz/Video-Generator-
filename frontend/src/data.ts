import type { Draft, MediaItem, Project, Tone } from './types'

export const mediaLibrary: MediaItem[] = [
  {
    id: 'mountains',
    name: 'Гірські обрії',
    image: '/assets/carpathians.jpg',
    type: 'image',
    category: 'Природа',
    tags: ['mountains', 'nature', 'гори', 'карпати', 'подорож'],
  },
  {
    id: 'coast',
    name: 'На березі океану',
    image: '/assets/coast.jpg',
    type: 'image',
    category: 'Подорожі',
    tags: ['ocean', 'sea', 'coast', 'море', 'океан', 'берег'],
  },
  {
    id: 'coffee',
    name: 'Кавовий ритуал',
    image: '/assets/coffee.jpg',
    type: 'image',
    category: 'Стиль життя',
    tags: ['coffee', 'morning', 'кава', 'кав', 'ранок'],
  },
  {
    id: 'forest',
    name: 'Тиша лісу',
    image: '/assets/forest.jpg',
    type: 'image',
    category: 'Природа',
    tags: ['forest', 'trees', 'ліс', 'nature', 'природа', 'карпати'],
  },
  {
    id: 'city',
    name: 'Ритм великого міста',
    image: '/assets/city.jpg',
    type: 'image',
    category: 'Подорожі',
    tags: ['city', 'urban', 'місто', 'міст', 'architecture'],
  },
  {
    id: 'path',
    name: 'Стежкою до вершини',
    image: '/assets/mountain-path.jpg',
    type: 'image',
    category: 'Природа',
    tags: ['hiking', 'mountains', 'travel', 'гори', 'подорож', 'карпати'],
  },
]

export const defaultDraft: Draft = {
  id: null,
  topic: '',
  format: '9:16',
  duration: 30,
  tone: 'Натхненний',
  script: '',
  tags: ['mountains', 'nature', 'travel'],
  voice: 'Остап',
  rate: 1,
  music: 'Без музики',
  musicVolume: 20,
  subtitles: true,
  mediaIds: ['mountains', 'forest', 'path'],
}

const seededDate = '2026-10-12T08:00:00.000Z'

export const sampleProjects: Project[] = [
  {
    ...defaultDraft,
    id: 'sample-mountains',
    title: 'Там, де починаються гори',
    topic: 'Подорож у гори: місця, які варто побачити хоча б раз',
    script:
      'Іноді потрібно просто зупинитися й подивитися вгору. Там, де гори торкаються неба, щоденні турботи стають меншими. Пройди стежкою крізь ліс, вдихни прохолодне повітря та відчуй свободу. Твоя наступна пригода ближче, ніж здається.',
    status: 'ready',
    createdAt: seededDate,
    updatedAt: seededDate,
  },
  {
    ...defaultDraft,
    id: 'sample-coast',
    title: 'Море має що сказати',
    topic: 'Чому нас так заспокоює море',
    script:
      'У шумі хвиль є особливий ритм. Він сповільнює думки й допомагає відчути цю мить. Прислухайся до моря та дозволь собі маленьку паузу. Іноді найкращі відповіді приходять у тиші.',
    mediaIds: ['coast'],
    tags: ['ocean', 'waves', 'coast'],
    duration: 45,
    status: 'ready',
    createdAt: '2026-10-11T10:00:00.000Z',
    updatedAt: '2026-10-11T10:00:00.000Z',
  },
  {
    ...defaultDraft,
    id: 'sample-coffee',
    title: 'Ранок починається з кави',
    topic: 'Маленькі ритуали для доброго ранку',
    script:
      'Новий день починається з маленьких речей. Аромат кави, світло у вікні та кілька хвилин для себе. Знайди свій ранковий ритуал. Нехай цей ранок буде спокійним.',
    mediaIds: ['coffee'],
    tags: ['coffee', 'morning', 'lifestyle'],
    status: 'draft',
    createdAt: '2026-10-10T10:00:00.000Z',
    updatedAt: '2026-10-10T10:00:00.000Z',
  },
]

export const steps = [
  { title: 'Ідея', detail: 'Тема та формат' },
  { title: 'Сценарій', detail: 'Текст майбутнього відео' },
  { title: 'Озвучка', detail: 'Голос і атмосфера' },
  { title: 'Матеріали', detail: 'Кадри та монтаж' },
]

export function createScriptTemplate(topic: string, tone: Tone, duration: number) {
  const lower = topic.toLowerCase()
  let script = ''
  let tags = ['story', 'lifestyle', 'inspiration']
  let mediaIds = ['mountains', 'forest', 'path']
  if (/(гір|гори|карпат|подорож|природ|ліс)/.test(lower)) {
    script =
      'Уяви місце, де повітря пахне лісом, а за кожним поворотом відкривається новий краєвид. Гори вчать нас сповільнюватися й помічати прості речі. Візьми зручне взуття, обери свою стежку та вирушай назустріч пригоді. Найкращий момент для нових вражень - зараз.'
    tags = ['mountains', 'forest', 'hiking']
  } else if (/(кав|ранок|ранк)/.test(lower)) {
    script =
      'У кожного доброго ранку є свій маленький ритуал. Аромат свіжої кави, м’яке світло й кілька хвилин спокою допомагають налаштуватися на день. Не поспішай: прислухайся до себе та обери те, що дарує тобі радість. Почни цей день із простого задоволення.'
    tags = ['coffee', 'morning', 'lifestyle']
    mediaIds = ['coffee']
  } else if (/(мор|океан|хвил|пляж)/.test(lower)) {
    script =
      'Зупинись на мить і прислухайся до хвиль. Море нагадує, що навіть у постійному русі можна знайти спокій. Прогуляйся берегом, відчуй вітер і залиш зайві думки позаду. Іноді коротка пауза змінює весь день.'
    tags = ['ocean', 'waves', 'coast']
    mediaIds = ['coast']
  } else {
    const subject = topic.trim().replace(/[.!?]+$/, '')
    script = `${subject} - тема, яку можна відкрити з нового боку. Почни з одного цікавого запитання, покажи конкретний приклад і поясни, чому це має значення. Додай власне спостереження, яке допоможе глядачеві краще зрозуміти ідею. Заверши відео думкою, яку хочеться запам’ятати.`
  }
  if (tone === 'Розмовний') script = `А ти колись замислювався про це? ${script}`
  if (tone === 'Інформативний') script = `Розгляньмо тему «${topic.trim()}». ${script}`
  if (duration === 15)
    script = script
      .split(/(?<=[.!?])\s+/)
      .slice(0, 2)
      .join(' ')
  if (duration === 60)
    script +=
      ' Зверни увагу на деталі, які зазвичай залишаються непоміченими. Саме вони роблять кожну історію особливою.'
  return { script, tags, mediaIds }
}
