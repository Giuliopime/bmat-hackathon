import { getSupabaseClient } from '../utils/supabase'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name?: string }>(event)
  const name = body.name?.trim()

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Role name is required' })
  }

  const supabase = getSupabaseClient()

  const { error } = await supabase
    .from('roles')
    .upsert({ name }, { onConflict: 'name', ignoreDuplicates: true })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { name }
})
