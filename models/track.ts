export interface Track {
  id: number
  title: string
  url: string
  added_by: string
  team: string | null
  role: string | null
  apple_music_id: string | null
  apple_music_url: string | null
  spotify_uri: string | null
  spotify_url: string | null
  soundcloud_id: string | null
  soundcloud_url: string | null
  created_at?: string
}
