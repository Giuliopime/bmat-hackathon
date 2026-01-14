import { useSoftAuth } from '../../composables/useSoftAuth'

export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/login') {
    return
  }

  if (import.meta.server) {
    return
  }

  const { isAuthenticated } = useSoftAuth()

  if (!isAuthenticated.value) {
    return navigateTo('/login')
  }
})
