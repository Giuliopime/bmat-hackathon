<script setup lang="ts">
import { reactive, computed, ref } from 'vue'
import { useToast } from '#imports'

import { useSoftAuth } from '../../composables/useSoftAuth'
import { fallbackRoles } from '../../models/roles'
import { fallbackTeams } from '../../models/teams'
import type { SoftUser } from '../../models/user'

const router = useRouter()
const { login, isAuthenticated } = useSoftAuth()
const toast = useToast()

if (isAuthenticated.value) {
  router.push('/')
}

const state = reactive<SoftUser>({
  name: '',
  team: '',
  role: ''
})

const loading = ref(false)

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

async function ensureTeam(name: string) {
  if (!name) {
    return
  }

  await $fetch('/api/teams', {
    method: 'POST',
    body: { name }
  })
  await refreshTeams()
}

async function ensureRole(name: string) {
  if (!name) {
    return
  }

  await $fetch('/api/roles', {
    method: 'POST',
    body: { name }
  })
  await refreshRoles()
}

async function handleSubmit() {
  if (!state.name.trim() || !state.team || !state.role) {
    toast.add({ title: 'Please complete all fields', color: 'error' })
    return
  }

  try {
    loading.value = true
    await ensureTeam(state.team)
    await ensureRole(state.role)
    login({ ...state, name: state.name.trim() })
    toast.add({ title: 'Welcome!', color: 'success' })
    router.push('/')
  }
  catch (error) {
    console.error(error)
    toast.add({ title: 'Login failed', color: 'error' })
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-120px)] flex items-center justify-center p-6">
    <UCard class="w-full max-w-xl">
      <template #header>
        <div class="space-y-1">
          <h1 class="text-2xl font-semibold">Soft login</h1>
          <p class="text-muted text-sm">Enter your details to access the shared tracklist.</p>
        </div>
      </template>

      <UForm
        :state="state"
        class="space-y-4"
        @submit.prevent="handleSubmit"
      >
        <div class="space-y-2">
          <label class="text-sm font-medium" for="login-name">Name</label>
          <UInput id="login-name" v-model="state.name" placeholder="Your full name" required />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium" for="login-team-select">Team (pick or type)</label>
            <select
              id="login-team-select"
              class="border rounded-md px-3 py-2 w-full bg-transparent"
              :value="teamOptions.includes(state.team) ? state.team : ''"
              @change="state.team = ($event.target as HTMLSelectElement).value"
            >
              <option value="">Select an existing team</option>
              <option
                v-for="team in teamOptions"
                :key="team"
                :value="team"
              >
                {{ team }}
              </option>
            </select>
            <UInput v-model="state.team" placeholder="Or type a new team" required />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium" for="login-role-select">Role (pick or type)</label>
            <select
              id="login-role-select"
              class="border rounded-md px-3 py-2 w-full bg-transparent"
              :value="roleOptions.includes(state.role) ? state.role : ''"
              @change="state.role = ($event.target as HTMLSelectElement).value"
            >
              <option value="">Select an existing role</option>
              <option
                v-for="role in roleOptions"
                :key="role"
                :value="role"
              >
                {{ role }}
              </option>
            </select>
            <UInput v-model="state.role" placeholder="Or type a new role" required />
          </div>
        </div>

        <UButton type="submit" color="primary" :loading="loading" class="w-full">
          Login
        </UButton>
      </UForm>
    </UCard>
  </div>
</template>
