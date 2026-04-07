import { useState, useRef, useEffect } from 'react'

const STORIES = [
  {
    id: 1,
    username: 'Casa Ronald CDMX',
    avatar: '🏠',
    label: 'Cena Viernes',
    viewed: false,
    slides: [
      { image: '/images/stories/cena1.jpg', caption: '20 familias cenaron juntas gracias a ustedes 🍕', time: 'Hace 2 días' },
      { image: '/images/stories/cena2.jpg', caption: 'Los niños no paraban de sonreír. ¡Gracias!', time: 'Hace 2 días' },
    ],
  },
  {
    id: 2,
    username: 'Fundación FIRM',
    avatar: '❤️',
    label: 'Kits Higiene',
    viewed: false,
    slides: [
      { image: '/images/stories/kit1.jpg', caption: '10 kits de higiene entregados a niños de la Casa', time: 'Hace 3 días' },
      { image: '/images/stories/kit2.jpg', caption: 'Sofía recibió su kit y nos regaló esta sonrisa', time: 'Hace 3 días' },
    ],
  },
  {
    id: 3,
    username: 'Voluntarios',
    avatar: '🙋',
    label: 'Taller Arte',
    viewed: false,
    slides: [
      { image: '/images/stories/arte1.jpg', caption: 'Taller de pintura con los niños de la Casa', time: 'Hace 5 días' },
      { image: '/images/stories/arte2.jpg', caption: 'Cada dibujo cuenta una historia de esperanza 🎨', time: 'Hace 5 días' },
    ],
  },
  {
    id: 4,
    username: 'McDonald\'s MX',
    avatar: '🍟',
    label: 'Gasolina',
    viewed: false,
    slides: [
      { image: '/images/stories/gas1.jpg', caption: 'Tanque lleno. 8 niños llegaron a sus terapias 🚐', time: 'Hace 1 semana' },
    ],
  },
  {
    id: 5,
    username: 'Comunidad',
    avatar: '🤝',
    label: 'Cobijas',
    viewed: false,
    slides: [
      { image: '/images/stories/cobija1.jpg', caption: 'Cobijas entregadas a mamás cuidadoras 🛏️', time: 'Hace 1 semana' },
      { image: '/images/stories/cobija2.jpg', caption: '"Alguien pensó en mí" — Mamá de Diego', time: 'Hace 1 semana' },
    ],
  },
  {
    id: 6,
    username: 'Casa Ronald GDL',
    avatar: '🏡',
    label: 'Desayunos',
    viewed: false,
    slides: [
      { image: '/images/stories/desayuno1.jpg', caption: 'Desayunos nutritivos para 5 familias nuevas 🥣', time: 'Hace 2 semanas' },
    ],
  },
]

export default function StoriesCarousel() {
  const [viewedIds, setViewedIds] = useState(new Set())
  const [activeStory, setActiveStory] = useState(null)
  const [activeSlide, setActiveSlide] = useState(0)
  const scrollRef = useRef(null)
  const progressRef = useRef(null)
  const timerRef = useRef(null)

  const SLIDE_DURATION = 5000

  function openStory(story) {
    setActiveStory(story)
    setActiveSlide(0)
    setViewedIds(prev => new Set([...prev, story.id]))
    document.body.style.overflow = 'hidden'
  }

  function closeStory() {
    setActiveStory(null)
    setActiveSlide(0)
    clearTimeout(timerRef.current)
    document.body.style.overflow = ''
  }

  function nextSlide() {
    if (!activeStory) return
    if (activeSlide < activeStory.slides.length - 1) {
      setActiveSlide(s => s + 1)
    } else {
      // Jump to next story
      const idx = STORIES.findIndex(s => s.id === activeStory.id)
      if (idx < STORIES.length - 1) {
        const next = STORIES[idx + 1]
        setViewedIds(prev => new Set([...prev, next.id]))
        setActiveStory(next)
        setActiveSlide(0)
      } else {
        closeStory()
      }
    }
  }

  function prevSlide() {
    if (activeSlide > 0) {
      setActiveSlide(s => s - 1)
    }
  }

  // Auto-advance
  useEffect(() => {
    if (!activeStory) return
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(nextSlide, SLIDE_DURATION)
    return () => clearTimeout(timerRef.current)
  }, [activeStory, activeSlide])

  return (
    <>
      {/* Stories Row */}
      <div className="stories" id="stories-carousel">
        <div className="stories__scroll" ref={scrollRef}>
          {STORIES.map(story => (
            <button
              className={`stories__item ${viewedIds.has(story.id) ? 'viewed' : ''}`}
              key={story.id}
              onClick={() => openStory(story)}
            >
              <div 
                className="stories__preview-bg" 
                style={{ backgroundImage: `url(${story.slides[0].image})` }}
              >
                <div className="stories__overlay" />
                <div className="stories__top-info">
                  <div className="stories__ring">
                    <div className="stories__avatar">{story.avatar}</div>
                  </div>
                </div>
                <span className="stories__label">{story.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Story Viewer (fullscreen) */}
      {activeStory && (
        <div className="story-viewer" onClick={closeStory}>
          <div className="story-viewer__content" onClick={e => e.stopPropagation()}>
            {/* Progress Bars */}
            <div className="story-viewer__progress" ref={progressRef}>
              {activeStory.slides.map((_, i) => (
                <div className="story-viewer__progress-track" key={i}>
                  <div
                    className={`story-viewer__progress-fill ${
                      i < activeSlide ? 'done' : i === activeSlide ? 'active' : ''
                    }`}
                    style={i === activeSlide ? { animationDuration: `${SLIDE_DURATION}ms` } : {}}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="story-viewer__header">
              <div className="story-viewer__user">
                <span className="story-viewer__user-avatar">{activeStory.avatar}</span>
                <span className="story-viewer__user-name">{activeStory.username}</span>
                <span className="story-viewer__user-time">{activeStory.slides[activeSlide].time}</span>
              </div>
              <button className="story-viewer__close" onClick={closeStory}>✕</button>
            </div>

            {/* Image */}
            <div className="story-viewer__image-wrapper">
              <img
                key={`${activeStory.id}-${activeSlide}`}
                className="story-viewer__image"
                src={activeStory.slides[activeSlide].image}
                alt={activeStory.slides[activeSlide].caption}
                onLoad={(e) => {
                  e.target.style.display = 'block'
                  e.target.parentElement.classList.remove('placeholder-active')
                }}
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.parentElement.classList.add('placeholder-active')
                }}
              />
              {/* Placeholder fallback */}
              <div className="story-viewer__placeholder">
                <span className="story-viewer__placeholder-emoji">{activeStory.avatar}</span>
                <span className="story-viewer__placeholder-text">Imagen próximamente</span>
              </div>
            </div>

            {/* Caption */}
            <div className="story-viewer__caption">
              <p>{activeStory.slides[activeSlide].caption}</p>
            </div>

            {/* Nav zones */}
            <div className="story-viewer__nav-prev" onClick={prevSlide} />
            <div className="story-viewer__nav-next" onClick={nextSlide} />
          </div>
        </div>
      )}
    </>
  )
}
