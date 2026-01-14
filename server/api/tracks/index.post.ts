import type { SoftUser } from '../../../models/user'
import type { Track } from '../../../models/track'

import { getSupabaseClient } from '../../utils/supabase'
import { buildTrackRecord } from '../../utils/track-metadata'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ url?: string; user?: SoftUser }>(event)
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

  return {
    item: data as Track
  }
})
