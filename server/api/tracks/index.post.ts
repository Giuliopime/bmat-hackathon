import type { SoftUser } from '../../../models/user'
import type { Track } from '../../../models/track'

import { getSupabaseClient } from '../../utils/supabase'
import { buildTrackRecord } from '../../utils/track-metadata'
import type { Playlist } from '~~/models/playlist'
import { $fetch } from 'ofetch'

const SPOTIFY_API = 'https://api.spotify.com/v1'
const APPLE_MUSIC_API = 'https://api.music.apple.com/v1'
const SOUNDCLOUD_API = 'https://api.soundcloud.com'
const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ url?: string, user?: SoftUser }>(event)
  console.log('[tracks.post] Incoming payload', body)

  if (!body.url || !body.user) {
    console.error('[tracks.post] Missing url or user', body)
    throw createError({ statusCode: 400, statusMessage: 'Track url and user are required' })
  }

  const supabase = getSupabaseClient()

  const payload = await buildTrackRecord(body.url, body.user)
  console.log('[tracks.post] Built track payload', payload)

  const { data, error } = await supabase
    .from('tracks')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    console.error('[tracks.post] Supabase insert failed', error)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  console.log('[tracks.post] Track saved', data)
  const track = data as Track

  let playlistQuery = supabase.from('playlists').select('*').limit(1)
  playlistQuery = body.user.team ? playlistQuery.eq('team', body.user.team) : playlistQuery.is('team', null)
  playlistQuery = body.user.role ? playlistQuery.eq('role', body.user.role) : playlistQuery.is('role', null)

  const { data: existing } = await playlistQuery.maybeSingle()

  if (existing) {
    const playlist = existing as Playlist
    const config = useRuntimeConfig()

    try {
      $fetch(`${APPLE_MUSIC_API}/me/library/playlists/${playlist.apple_music_id}/tracks`, {
        method: 'POST',
        body: {
          data: [{
            id: track.apple_music_id,
            type: 'songs'
          }]
        },
        headers: {
          'Authorization': `Bearer ${config.appleMusicDeveloperToken}`,
          'Music-User-Token': config.appleMusicUserToken
        }
      })
    } catch { /* empty */ }

    try {
      $fetch(`${SPOTIFY_API}/playlists/${playlist.spotify_id}/tracks`, {
        method: 'POST',
        body: {
          uris: [
            track.spotify_uri
          ]
        },
        headers: {
          Authorization: `Bearer ${config.spotifyToken}`
        }
      })
    } catch { /* empty */ }
  }

  return {
    item: track
  }
})
