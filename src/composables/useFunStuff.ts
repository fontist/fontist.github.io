import { onMounted, onBeforeUnmount } from 'vue'

const KONAMI = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a',
]

const GLYPH_RAIN = '★◆◇○●△▲▽▼✦✧❖⚡✎⚙⚠❄✈✉✓✕✗✘❀❁❂❃❆❇❈❉❊❋♔♕♖♗♘♙♚♛♜♝♞♟♻⚛⚜⚡♾'
const TRAIL_GLYPHS = 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ☀☁☂★☆☎☘♨⚓⚖⚙⚡❄✈✉✎✓✦✧❀❆❇❈♩♪♫♬♭♮♯'

function randomGlyph(set: string) {
  return set[Math.floor(Math.random() * set.length)]
}

function triggerGlyphRain() {
  for (let i = 0; i < 100; i++) {
    const el = document.createElement('span')
    el.textContent = randomGlyph(GLYPH_RAIN)
    el.style.cssText = `position:fixed;top:-60px;left:${Math.random() * 100}vw;font-size:${14 + Math.random() * 32}px;color:hsl(${Math.random() * 60 + 320},85%,${50 + Math.random() * 25}%);pointer-events:none;z-index:99999;text-shadow:0 0 12px currentColor;font-family:'Essenfont','IBM Plex Sans',sans-serif`
    document.body.appendChild(el)

    const dur = 2000 + Math.random() * 3000
    el.animate(
      [
        { transform: `translateY(0) rotate(0deg)`, opacity: 1 },
        { transform: `translateY(${window.innerHeight + 100}px) rotate(${Math.random() * 720 - 360}deg)`, opacity: 0 },
      ],
      { duration: dur, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' },
    ).onfinish = () => el.remove()
  }

  const flash = document.createElement('div')
  flash.style.cssText = `position:fixed;inset:0;z-index:99998;pointer-events:none;background:radial-gradient(circle at 50% 50%, hsla(340,80%,60%,0.15), transparent 70%)`
  document.body.appendChild(flash)
  flash.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1500, easing: 'ease-out' }).onfinish = () => flash.remove()
}

let logoClickCount = 0
let logoTimer: ReturnType<typeof setTimeout> | null = null

function triggerLogoSpin() {
  const logo = document.querySelector('.nav-logo')
  if (!logo) return

  logo.animate(
    [
      { transform: 'rotate(0deg) scale(1)' },
      { transform: 'rotate(180deg) scale(1.3)' },
      { transform: 'rotate(360deg) scale(1.1)' },
      { transform: 'rotate(540deg) scale(1.3)' },
      { transform: 'rotate(720deg) scale(1)' },
    ],
    { duration: 1200, easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' },
  )

  const nav = document.querySelector('.nav')
  nav?.animate(
    [{ filter: 'hue-rotate(0deg)' }, { filter: 'hue-rotate(360deg)' }],
    { duration: 1200, easing: 'linear' },
  )

  for (let i = 0; i < 30; i++) {
    const el = document.createElement('span')
    el.textContent = randomGlyph(GLYPH_RAIN)
    el.style.cssText = `position:fixed;left:50%;top:60px;font-size:${12 + Math.random() * 20}px;color:hsl(${Math.random() * 360},80%,60%);pointer-events:none;z-index:99999;text-shadow:0 0 8px currentColor`
    document.body.appendChild(el)
    const angle = (Math.PI * 2 * i) / 30 + Math.random() * 0.5
    const dist = 150 + Math.random() * 250
    el.animate(
      [
        { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
        {
          transform: `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px)) scale(1.5)`,
          opacity: 0,
        },
      ],
      { duration: 1000 + Math.random() * 800, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' },
    ).onfinish = () => el.remove()
  }
}

let lastTrail = 0
function onMouseMove(e: MouseEvent) {
  const now = performance.now()
  if (now - lastTrail < 70) return
  lastTrail = now

  const el = document.createElement('span')
  el.textContent = randomGlyph(TRAIL_GLYPHS)
  el.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;font-size:${10 + Math.random() * 14}px;color:var(--color-accent);pointer-events:none;z-index:99998;opacity:0.5;transform:translate(-50%,-50%);font-family:'Essenfont','IBM Plex Sans',sans-serif`
  document.body.appendChild(el)

  el.animate(
    [
      { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 0.5 },
      { transform: 'translate(-50%, calc(-50% - 35px)) scale(0.2) rotate(90deg)', opacity: 0 },
    ],
    { duration: 700, easing: 'ease-out' },
  ).onfinish = () => el.remove()
}

let konamiIdx = 0
function onKeyDown(e: KeyboardEvent) {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
  if (key === KONAMI[konamiIdx].toLowerCase() || key === KONAMI[konamiIdx]) {
    konamiIdx++
    if (konamiIdx === KONAMI.length) {
      triggerGlyphRain()
      konamiIdx = 0
    }
  } else {
    konamiIdx = key === KONAMI[0] ? 1 : 0
  }
}

function onLogoClick() {
  logoClickCount++
  if (logoTimer) clearTimeout(logoTimer)
  logoTimer = setTimeout(() => { logoClickCount = 0 }, 2000)

  if (logoClickCount >= 5) {
    logoClickCount = 0
    triggerLogoSpin()
  }
}

function attachLogoListener() {
  const diamond = document.querySelector('.sf-rule-mark')
  diamond?.addEventListener('click', onLogoClick)
}

function detachLogoListener() {
  document.querySelector('.sf-rule-mark')?.removeEventListener('click', onLogoClick)
}

export function useFunStuff(opts: { trail?: boolean; konami?: boolean; logo?: boolean } = {}) {
  const { trail = false, konami = true, logo = true } = opts

  onMounted(() => {
    if (trail) document.addEventListener('mousemove', onMouseMove, { passive: true })
    if (konami) document.addEventListener('keydown', onKeyDown)
    if (logo) setTimeout(attachLogoListener, 100)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('keydown', onKeyDown)
    detachLogoListener()
  })
}

export function animateCountUp(el: HTMLElement, target: number, duration = 1500) {
  const start = performance.now()
  const startVal = 0

  function frame(now: number) {
    const elapsed = now - start
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    const val = Math.floor(startVal + (target - startVal) * eased)
    el.textContent = val.toLocaleString()
    if (progress < 1) requestAnimationFrame(frame)
    else el.textContent = target.toLocaleString()
  }

  requestAnimationFrame(frame)
}

export function wobbleText(el: HTMLElement) {
  el.animate(
    [
      { fontWeight: '400', letterSpacing: '0em' },
      { fontWeight: '900', letterSpacing: '0.02em' },
      { fontWeight: '400', letterSpacing: '0em' },
    ],
    { duration: 600, easing: 'ease-in-out' },
  )
}
