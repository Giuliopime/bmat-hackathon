import type { Playlist } from '../../models/playlist'

import {
  createApplePlaylist,
  createSoundcloudPlaylist,
  createSpotifyPlaylist
} from '../utils/platforms'
import { getSupabaseClient } from '../utils/supabase'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ team?: string | null; role?: string | null }>(event)
  console.log('[playlists.post] Incoming filters', body)

  const team = body.team?.trim() ? body.team.trim() : null
  const role = body.role?.trim() ? body.role.trim() : null

  if (!team && !role) {
    console.error('[playlists.post] Missing filters, refusing to build playlist')
    throw createError({ statusCode: 400, statusMessage: 'At least one filter is required to build a playlist' })
  }

  const supabase = getSupabaseClient()

  let playlistQuery = supabase.from('playlists').select('*').limit(1)
  playlistQuery = team ? playlistQuery.eq('team', team) : playlistQuery.is('team', null)
  playlistQuery = role ? playlistQuery.eq('role', role) : playlistQuery.is('role', null)

  const { data: existing, error: playlistError } = await playlistQuery.maybeSingle()

  if (playlistError && playlistError.code !== 'PGRST116') {
    console.error('[playlists.post] Failed fetching existing playlist', playlistError)
    throw createError({ statusCode: 500, statusMessage: playlistError.message })
  }

  if (existing) {
    console.log('[playlists.post] Reusing existing playlist', existing)
    return {
      item: existing as Playlist,
      links: buildLinks(existing as Playlist)
    }
  }

  let trackQuery = supabase.from('tracks').select('*')
  trackQuery = team ? trackQuery.eq('team', team) : trackQuery
  trackQuery = role ? trackQuery.eq('role', role) : trackQuery

  const { data: tracks, error: trackError } = await trackQuery

  if (trackError) {
    console.error('[playlists.post] Failed fetching tracks', trackError)
    throw createError({ statusCode: 500, statusMessage: trackError.message })
  }

  if (!tracks?.length) {
    console.warn('[playlists.post] No tracks match filters', { team, role })
    throw createError({ statusCode: 400, statusMessage: 'No tracks found for these filters' })
  }

  const playlistName = `bmat-${team ?? 'all'}-${role ?? 'all'}`
  console.log('[playlists.post] Creating playlists with name', playlistName, 'tracks', tracks.length)

  const spotifyUris = tracks.map(track => track.spotify_uri).filter(Boolean) as string[]
  const appleIds = tracks.map(track => track.apple_music_id).filter(Boolean) as string[]
  const soundcloudIds = tracks.map(track => track.soundcloud_id).filter(Boolean) as string[]

  console.log('[playlists.post] Track ID summary', { spotifyUris, appleIds, soundcloudIds })

  const config = useRuntimeConfig()

  const [spotifyId, appleId, soundcloudId] = await Promise.all([
    spotifyUris.length ? createSpotifyPlaylist(playlistName, spotifyUris, config.spotifyToken, config.spotifyUserId) : Promise.resolve(null),
    appleIds.length ? createApplePlaylist(playlistName, appleIds, config.appleMusicDeveloperToken, config.appleMusicUserToken) : Promise.resolve(null),
    soundcloudIds.length ? createSoundcloudPlaylist(playlistName, soundcloudIds, config.soundcloudToken) : Promise.resolve(null)
  ])

  console.log('[playlists.post] Playlist IDs', { spotifyId, appleId, soundcloudId })

  const { data: created, error: insertError } = await supabase
    .from('playlists')
    .insert({
      name: playlistName,
      team,
      role,
      spotify_id: spotifyId,
      apple_music_id: appleId,
      soundcloud_id: soundcloudId
    })
    .select('*')
    .single()

  if (insertError) {
    console.error('[playlists.post] Failed to store playlist', insertError)
    throw createError({ statusCode: 500, statusMessage: insertError.message })
  }

  console.log('[playlists.post] Playlist stored', created)

  return {
    item: created as Playlist,
    links: buildLinks(created as Playlist)
  }
})

const buildLinks = (playlist: Playlist) => {
  return {
    spotify: playlist.spotify_id ? `https://open.spotify.com/playlist/${playlist.spotify_id}` : null,
    apple: playlist.apple_music_id ? `https://music.apple.com/library/playlist/${playlist.apple_music_id}` : null,
    soundcloud: playlist.soundcloud_id ? `https://soundcloud.com/iuliopime/sets/${playlist.soundcloud_id}` : null
  }
}
