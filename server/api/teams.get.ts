import { fallbackTeams } from '../../models/teams'
import { getSupabaseClient } from '../utils/supabase'

export default defineEventHandler(async () => {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('teams')
    .select('name')
    .order('name')

  if (error) {
    console.warn('[teams.get] Falling back to static teams', error)
    return { items: fallbackTeams }
  }

  const rows = (data ?? []) as Array<{ name: string }>

  return {
    items: rows.map(entry => entry.name)
  }
})
