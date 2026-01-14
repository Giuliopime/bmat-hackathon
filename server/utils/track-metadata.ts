import type { SoftUser } from '../../models/user'
import type { TrackIdentity } from './platforms'
import {
  detectPlatform,
  fetchAppleMetadataFromUrl,
  fetchSpotifyMetadataFromUrl,
  fetchYouTubeMetadataFromUrl,
  resolveSoundcloudTrack,
  searchAppleTrack,
  searchSoundcloudTrack,
  searchSpotifyTrack
} from './platforms'

interface TrackRecordPayload {
  title: string
  url: string
  added_by: string
  team: string | null
  role: string | null
  apple_music_id: string | null
  spotify_uri: string | null
  soundcloud_id: string | null
}

const log = (...args: unknown[]) => console.log('[track-metadata]', ...args)

export const buildTrackRecord = async (url: string, user: SoftUser): Promise<TrackRecordPayload> => {
  const config = useRuntimeConfig()

  log('Building track record', { url, user })

  const platform = detectPlatform(url)
  log('Detected platform', platform)

  const base = await resolveBaseMetadata(url, platform, config)
  log('Base metadata result', base)

  const query = [base?.title, base?.artist].filter(Boolean).join(' ').trim()
  log('Cross-platform search query', query)

  const [spotify, apple, soundcloud] = await Promise.all([
    base?.spotifyUri ? base : searchSpotifyTrack(query, config.spotifyToken),
    base?.appleMusicId ? base : searchAppleTrack(query, config.appleMusicDeveloperToken),
    base?.soundcloudId ? base : searchSoundcloudTrack(query, config.soundcloudClientId, config.soundcloudToken)
  ])

  log('Platform lookups completed', { spotify, apple, soundcloud })

  const title = base?.title || spotify?.title || apple?.title || soundcloud?.title || url

  const record: TrackRecordPayload = {
    title,
    url,
    added_by: user.name,
    team: user.team,
    role: user.role,
    apple_music_id: base?.appleMusicId ?? apple?.appleMusicId ?? null,
    spotify_uri: base?.spotifyUri ?? spotify?.spotifyUri ?? null,
    soundcloud_id: base?.soundcloudId ?? soundcloud?.soundcloudId ?? null
  }

  log('Final track payload', record)

  return record
}

const resolveBaseMetadata = async (
  url: string,
  platform: ReturnType<typeof detectPlatform>,
  config: ReturnType<typeof useRuntimeConfig>
): Promise<TrackIdentity | null> => {
  log('Resolving base metadata', { platform, url })

  let result: TrackIdentity | null = null

  switch (platform) {
    case 'spotify':
      result = await fetchSpotifyMetadataFromUrl(url, config.spotifyToken)
      break
    case 'apple':
      result = await fetchAppleMetadataFromUrl(url, config.appleMusicDeveloperToken)
      break
    case 'soundcloud':
      result = await resolveSoundcloudTrack(url, config.soundcloudClientId, config.soundcloudToken)
      break
    case 'youtube':
      result = await fetchYouTubeMetadataFromUrl(url, config.youtubeApiKey)
      break
    default:
      result = null
  }

  log('resolveBaseMetadata result', result)
  return result
}
