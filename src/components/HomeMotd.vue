<script setup>
// HomeMotd — typewriter effect for the homepage hero. Cycles through a
// list of short messages with a typing animation. Mounts via client:load
// from index.astro so the animation starts immediately on paint.
import { ref, onMounted, onBeforeUnmount } from 'vue'

const motds = [
  'Installing fonts so humanity doesn\'t have to.',
  'One command. Thousands of typefaces.',
  'Stop worrying about fonts. We already did.',
  'Making type accessible for everyone.',
  'The font pipeline that runs while you sleep.',
  'Automating typography for a better web.',
]

const motdText = ref('')
const motdIndex = ref(0)
let typeTimer = null

function typeMotd() {
  const msg = motds[motdIndex.value]
  let i = 0
  motdText.value = ''
  ;(function step() {
    if (i < msg.length) {
      motdText.value = msg.slice(0, ++i)
      typeTimer = setTimeout(step, 30 + Math.random() * 45)
    } else {
      typeTimer = setTimeout(eraseMotd, 3800)
    }
  })()
}

function eraseMotd() {
  ;(function step() {
    if (motdText.value.length > 0) {
      motdText.value = motdText.value.slice(0, -1)
      typeTimer = setTimeout(step, 18)
    } else {
      motdIndex.value = (motdIndex.value + 1) % motds.length
      typeTimer = setTimeout(typeMotd, 350)
    }
  })()
}

function skipMotd() {
  if (typeTimer) clearTimeout(typeTimer)
  motdText.value = ''
  motdIndex.value = (motdIndex.value + 1) % motds.length
  typeMotd()
}

onMounted(typeMotd)
onBeforeUnmount(() => { if (typeTimer) clearTimeout(typeTimer) })
</script>

<template>
  <h1 class="hero-motd" @click="skipMotd" title="Click for next message">
    {{ motdText }}<span class="motd-cursor"></span>
  </h1>
</template>

<style scoped>
/* The hero-motd rule lives in main.css (it's shared with the legacy
   .vue page). This scoped block is intentionally empty. */
</style>
