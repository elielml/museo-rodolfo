import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hrxjdgsnyriluppetqcl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyeGpkZ3NueXJpbHVwcGV0cWNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5ODM5NTQsImV4cCI6MjEwNjU1OTk1NH0.GTOF3D14zok9aROquoAYrhJ9SCmnKgCnhCSxYBTNfqo'

export const supabase = createClient(supabaseUrl, supabaseKey)