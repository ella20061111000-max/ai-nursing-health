// ============================================================
// Supabase Client — 云端数据库
// ============================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://hzniekxkegpzmwfeoxtk.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bmlla3hrZWdwem13ZmVveHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1Mzg1NTUsImV4cCI6MjA5OTExNDU1NX0.agrbOVPIs8n7m3j9Y5_jAzCovFuq-sV2la5Fh_7Xsyo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
