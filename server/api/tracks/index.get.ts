import type { Track } from '../../../models/track'

import { getSupabaseClient } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  const supabase = getSupabaseClient()
  const query = getQuery(event)

  const team = typeof query.team === 'string' && query.team.length ? query.team : null
  const role = typeof query.role === 'string' && query.role.length ? query.role : null

  let builder = supabase
    .from('tracks')
    .select('*')
    .order('created_at', { ascending: false })

  if (team) {
    builder = builder.eq('team', team)
  }

  if (role) {
    builder = builder.eq('role', role)
  }

  const { data, error } = await builder

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return {
    items: (data ?? []) as Track[]
  }
})
