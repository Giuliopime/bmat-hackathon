import { computed } from 'vue'
import { StorageSerializers, useLocalStorage } from '@vueuse/core'

import type { SoftUser } from '../models/user'

const STORAGE_KEY = 'bmat-soft-user'

export const useSoftAuth = () => {
  const user = useLocalStorage<SoftUser | null>(STORAGE_KEY, null, {
    deep: true,
    listenToStorageChanges: true,
    serializer: StorageSerializers.object
  })

  const isAuthenticated = computed(() => Boolean(user.value?.name && user.value?.team && user.value?.role))

  function login(payload: SoftUser) {
    user.value = payload
  }

  function logout() {
    user.value = null
  }

  return {
    user,
    isAuthenticated,
    login,
    logout
  }
}
