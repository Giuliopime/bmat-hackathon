export interface Playlist {
  id: number
  name: string
  team: string | null
  role: string | null
  apple_music_id: string | null
  spotify_id: string | null
  soundcloud_id: string | null
  created_at?: string
}
