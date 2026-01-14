// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/': { prerender: true }
  },

  runtimeConfig: {
    supabaseUrl: process.env.NUXT_SUPABASE_URL || '',
    supabaseServiceKey: process.env.NUXT_SUPABASE_SERVICE_KEY || '',
    spotifyToken: process.env.NUXT_SPOTIFY_TOKEN || '',
    spotifyUserId: process.env.NUXT_SPOTIFY_USER_ID || '',
    appleMusicDeveloperToken: process.env.NUXT_APPLE_MUSIC_DEVELOPER_TOKEN || '',
    appleMusicUserToken: process.env.NUXT_APPLE_MUSIC_USER_TOKEN || '',
    soundcloudToken: process.env.NUXT_SOUNDCLOUD_TOKEN || '',
    soundcloudClientId: process.env.NUXT_SOUNDCLOUD_CLIENT_ID || '',
    soundcloudUserId: process.env.NUXT_SOUNDCLOUD_USER_ID || '',
    youtubeApiKey: process.env.NUXT_YOUTUBE_API_KEY || ''
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
