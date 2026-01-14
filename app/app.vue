<script setup>
import { computed } from 'vue'

import { useSoftAuth } from '../composables/useSoftAuth'

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

useSeoMeta({
  title: 'BMAT Tracks',
  description: 'Internal music sharing playground for BMAT teams.',
  ogTitle: 'BMAT Tracks',
  ogDescription: 'Internal music sharing playground for BMAT teams.'
})

const router = useRouter()
const { user, isAuthenticated, logout } = useSoftAuth()

const initials = computed(() => {
  if (!user.value?.name) {
    return ''
  }

  return user.value.name
    .split(' ')
    .filter(Boolean)
    .map(part => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('')
})

function handleLogout() {
  logout()
  router.push('/login')
}
</script>

<template>
  <UApp>
    <UHeader>
      <template #left>
        <NuxtLink to="/" class="font-semibold text-lg">
          BMAT Tracks
        </NuxtLink>
      </template>

      <template #right>
        <UColorModeButton />

        <div v-if="isAuthenticated" class="flex items-center gap-3">
          <div class="flex flex-col text-right text-sm">
            <span class="font-medium">{{ user?.name }}</span>
            <span class="text-muted">
              {{ [user?.team, user?.role].filter(Boolean).join(' • ') }}
            </span>
          </div>
          <UAvatar
            :text="initials"
            size="md"
          />
          <UButton color="neutral" variant="soft" @click="handleLogout">
            Logout
          </UButton>
        </div>

        <UButton
          v-else
          color="neutral"
          variant="soft"
          to="/login"
        >
          Login
        </UButton>
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>
  </UApp>
</template>
