import { fallbackRoles } from '../../models/roles'
import { getSupabaseClient } from '../utils/supabase'

export default defineEventHandler(async () => {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('roles')
    .select('name')
    .order('name')

  if (error) {
    console.warn('[roles.get] Falling back to static roles', error)
    return { items: fallbackRoles }
  }

  const rows = (data ?? []) as Array<{ name: string }>

  return {
    items: rows.map(entry => entry.name)
  }
})
