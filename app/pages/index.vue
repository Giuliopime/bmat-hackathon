<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useToast } from '#imports'

import { useSoftAuth } from '../../composables/useSoftAuth'
import type { Track } from '../../models/track'
import type { SoftUser } from '../../models/user'
import { fallbackRoles } from '../../models/roles'
import { fallbackTeams } from '../../models/teams'

interface PlaylistLinks {
  spotify: string | null
  apple: string | null
  soundcloud: string | null
}

const toast = useToast()
const router = useRouter()
const route = useRoute()
const { user } = useSoftAuth()

const teamFilter = ref(typeof route.query.team === 'string' ? route.query.team : '')
const roleFilter = ref(typeof route.query.role === 'string' ? route.query.role : '')

const hasActiveFilter = computed(() => Boolean(teamFilter.value || roleFilter.value))

const { data: teamsData, refresh: refreshTeams } = await useFetch<{ items: string[] }>('/api/teams')
const { data: rolesData, refresh: refreshRoles } = await useFetch<{ items: string[] }>('/api/roles')

const teamOptions = computed(() => {
  return Array.from(new Set([...(teamsData.value?.items ?? []), ...fallbackTeams]))
    .sort((a, b) => a.localeCompare(b))
})

const roleOptions = computed(() => {
  return Array.from(new Set([...(rolesData.value?.items ?? []), ...fallbackRoles]))
    .sort((a, b) => a.localeCompare(b))
})

const {
  data: tracksData,
  pending: tracksPending,
  refresh: refreshTracks
} = await useAsyncData('tracks-list', () => {
  return $fetch<{ items: Track[] }>('/api/tracks', {
    query: {
      team: teamFilter.value || undefined,
      role: roleFilter.value || undefined
    }
  })
}, {
  watch: [teamFilter, roleFilter]
})

if (import.meta.client) {
  watch([teamFilter, roleFilter], ([team, role]) => {
    const nextQuery: Record<string, string> = {}
    if (team) {
      nextQuery.team = team
    }
    if (role) {
      nextQuery.role = role
    }
    router.replace({ query: nextQuery })
  })
}

const showAddTrack = ref(false)
const newTrackUrl = ref('')
const addTrackLoading = ref(false)

async function ensureTeam(name: string) {
  if (!name) {
    return
  }
  await $fetch('/api/teams', { method: 'POST', body: { name } })
  await refreshTeams()
}

async function ensureRole(name: string) {
  if (!name) {
    return
  }
  await $fetch('/api/roles', { method: 'POST', body: { name } })
  await refreshRoles()
}

async function submitTrack() {
  if (!newTrackUrl.value.trim()) {
    toast.add({ title: 'Provide a track link', color: 'error' })
    return
  }

  if (!user.value) {
    toast.add({ title: 'Login required', color: 'error' })
    return
  }

  try {
    addTrackLoading.value = true
    const payload = {
      url: newTrackUrl.value.trim(),
      user: user.value as SoftUser
    }
    console.log('[Tracks] Sending add request', payload)

    const response = await $fetch('/api/tracks', {
      method: 'POST',
      body: payload
    })

    console.log('[Tracks] Server response', response)

    toast.add({ title: 'Track added', color: 'success' })
    newTrackUrl.value = ''
    showAddTrack.value = false
    await refreshTracks()
    await ensureTeam(user.value.team)
    await ensureRole(user.value.role)
  } catch (error) {
    console.error('[Tracks] Failed to add track', error)
    toast.add({ title: 'Unable to add track', color: 'error' })
  } finally {
    addTrackLoading.value = false
  }
}

const playlistLoading = ref(false)
const showPlaylistModal = ref(false)
const playlistLinks = ref<PlaylistLinks | null>(null)

async function openPlaylist() {
  if (!hasActiveFilter.value) {
    return
  }

  try {
    playlistLoading.value = true
    const requestBody = {
      team: teamFilter.value || null,
      role: roleFilter.value || null
    }
    console.log('[Playlist] Request body', requestBody)

    const response = await $fetch<{ links: PlaylistLinks }>('/api/playlists', {
      method: 'POST',
      body: requestBody
    })

    console.log('[Playlist] Response', response)

    playlistLinks.value = response.links
    showPlaylistModal.value = true
  } catch (error) {
    console.error('[Playlist] Failed to open playlist', error)
    toast.add({ title: 'Failed to open playlist', color: 'error' })
  } finally {
    playlistLoading.value = false
  }
}

const tracks = computed(() => tracksData.value?.items ?? [])
</script>

<template>
  <div class="space-y-6 px-4 max-w-7xl mx-auto">
    <section class="flex flex-col gap-4 md:flex-row md:items-end mt-2">
      <div class="flex-1 space-y-2">
        <label
          class="text-sm font-medium"
          for="team-filter"
        >Team filter</label>
        <select
          id="team-filter"
          v-model="teamFilter"
          class="border rounded-md px-3 py-2 w-full bg-transparent"
        >
          <option value="">
            All teams
          </option>
          <option
            v-for="team in teamOptions"
            :key="team"
            :value="team"
          >
            {{ team }}
          </option>
        </select>
      </div>

      <div class="flex-1 space-y-2">
        <label
          class="text-sm font-medium"
          for="role-filter"
        >Role filter</label>
        <select
          id="role-filter"
          v-model="roleFilter"
          class="border rounded-md px-3 py-2 w-full bg-transparent"
        >
          <option value="">
            All roles
          </option>
          <option
            v-for="role in roleOptions"
            :key="role"
            :value="role"
          >
            {{ role }}
          </option>
        </select>
      </div>

      <div class="flex gap-2">
        <UButton
          color="neutral"
          variant="soft"
          @click="showAddTrack = true"
        >
          Add track
        </UButton>
        <UButton
          color="primary"
          variant="solid"
          :disabled="!hasActiveFilter"
          :loading="playlistLoading"
          @click="openPlaylist"
        >
          Open playlist
        </UButton>
      </div>
    </section>

    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-xl font-semibold">
              Tracks
            </h2>
            <p class="text-muted text-sm">
              Latest submissions from everyone.
            </p>
          </div>
          <UBadge
            color="neutral"
            variant="soft"
          >
            {{ tracks.length }} total
          </UBadge>
        </div>
      </template>

      <div
        v-if="tracksPending"
        class="py-8 text-center text-muted"
      >
        Loading tracks...
      </div>

      <div
        v-else-if="tracks.length"
        class="space-y-4"
      >
        <div
          v-for="track in tracks"
          :key="track.id || track.url"
          class="border border-muted-200 dark:border-muted-800 rounded-lg p-4 space-y-3"
        >
          <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="font-medium text-lg">
                {{ track.title }}
              </p>
              <p class="text-sm text-muted">
                Added by {{ track.added_by }}
                • {{ track.team || 'No team' }}
                • {{ track.role || 'No role' }}
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              <UButton
                v-if="track.apple_music_id"
                label="Apple Music"
                variant="subtle"
                size="xs"
                icon="i-simple-icons-applemusic"
                class="rounded-full"
                :to="track.apple_music_url ?? ''"
                target="_blank"
              />

              <UButton
                v-if="track.spotify_uri"
                label="Spotify"
                variant="subtle"
                size="xs"
                color="success"
                icon="i-simple-icons-spotify"
                class="rounded-full"
                :to="track.spotify_url ?? ''"
                target="_blank"
              />

              <UButton
                v-if="track.soundcloud_id"
                label="SoundCloud"
                variant="subtle"
                size="xs"
                color="warning"
                icon="i-simple-icons-soundcloud"
                class="rounded-full"
                :to="track.soundcloud_url ?? ''"
                target="_blank"
              />
            </div>
          </div>
        </div>
      </div>

      <div
        v-else
        class="text-center text-muted py-4"
      >
        No tracks yet. Be the first to add one!
      </div>
    </UCard>

    <UModal v-model:open="showAddTrack">
      <template #content>
        <UCard class="w-full max-w-2xl">
          <template #header>
            <div>
              <h3 class="text-lg font-semibold">
                Add track
              </h3>
              <p class="text-sm text-muted">
                Paste a Spotify, Apple Music, SoundCloud, or YouTube link.
              </p>
            </div>
          </template>

          <UForm @submit.prevent="submitTrack">
            <div class="space-y-2 flex flex-col">
              <label
                class="text-sm font-medium"
                for="new-track-url"
              >Track link</label>
              <UInput
                id="new-track-url"
                v-model="newTrackUrl"
                placeholder="https://"
                required
              />
            </div>

            <div class="mt-6 flex justify-end gap-2">
              <UButton
                color="neutral"
                variant="soft"
                @click="showAddTrack = false"
              >
                Cancel
              </UButton>
              <UButton
                type="submit"
                color="primary"
                :loading="addTrackLoading"
                :disabled="!newTrackUrl"
              >
                Save
              </UButton>
            </div>
          </UForm>
        </UCard>
      </template>
    </UModal>

    <UModal v-model:open="showPlaylistModal">
      <template #content>
        <UCard class="w-full max-w-xl mx-auto">
          <template #header>
            <h3 class="text-lg font-semibold text-center">
              Playlist links
            </h3>
          </template>

          <div class="flex items-center justify-center gap-4">
            <div
              v-if="playlistLinks?.spotify"
              class="flex justify-between items-center"
            >
              <UButton
                :to="playlistLinks.spotify"
                target="_blank"
                color="success"
                variant="soft"
                icon="i-simple-icons-spotify"
              >
                Spotify
              </UButton>
            </div>
            <div
              v-if="playlistLinks?.apple"
              class="flex justify-between items-center"
            >
              <UButton
                :to="playlistLinks.apple"
                target="_blank"
                variant="soft"
								icon="i-simple-icons-applemusic"
              >
                Apple Music
              </UButton>
            </div>
            <div
              v-if="playlistLinks?.soundcloud"
              class="flex justify-between items-center"
            >
              <UButton
                :to="playlistLinks.soundcloud"
                target="_blank"
                color="warning"
                variant="soft"
								icon="i-simple-icons-soundcloud"
              >
                SoundCloud
              </UButton>
            </div>
            <div
              v-if="!playlistLinks?.spotify && !playlistLinks?.apple && !playlistLinks?.soundcloud"
              class="text-center text-muted"
            >
              No playlist links were generated.
            </div>
          </div>

          <template #footer>
            <UButton
              block
              color="neutral"
							variant="soft"
              @click="showPlaylistModal = false"
            >
              Close
            </UButton>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
