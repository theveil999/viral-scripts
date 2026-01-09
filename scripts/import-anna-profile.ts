/**
 * Script to import Anna's voice profile directly into the database
 * Run with: npx tsx scripts/import-anna-profile.ts
 */
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load env
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function importAnnaProfile() {
  console.log('📦 Loading Anna\'s voice profile...')
  
  // Load the profile JSON
  const profilePath = path.join(__dirname, 'anna-voice-profile.json')
  const profileData = JSON.parse(fs.readFileSync(profilePath, 'utf-8'))
  
  console.log('✅ Profile loaded:', profileData.identity.stage_name)
  
  // Check if Anna already exists
  const { data: existing } = await supabase
    .from('models')
    .select('id, name, stage_name')
    .or(`name.ilike.%anna%,stage_name.ilike.%anna%`)
    .limit(1)
    .single()
  
  if (existing) {
    console.log(`\n⚠️  Anna already exists in DB:`)
    console.log(`   ID: ${existing.id}`)
    console.log(`   Name: ${existing.name}`)
    console.log(`   Stage Name: ${existing.stage_name}`)
    console.log('\nWould you like to UPDATE her profile? (This script will update)')
    
    // Update existing profile
    const { error: updateError } = await supabase
      .from('models')
      .update({
        voice_profile: profileData,
        archetype_tags: [
          profileData.archetype_assignment.primary,
          profileData.archetype_assignment.secondary
        ].filter(Boolean),
        niche_tags: profileData.content.niche_topics,
        explicitness_level: profileData.spicy.explicitness_level,
        boundaries: profileData.boundaries,
      })
      .eq('id', existing.id)
    
    if (updateError) {
      console.error('❌ Update failed:', updateError.message)
      process.exit(1)
    }
    
    console.log('✅ Profile UPDATED successfully!')
    console.log(`\n🚀 Go to http://localhost:3000/models/${existing.id} to generate scripts!`)
    return
  }
  
  // Insert new profile
  console.log('\n📝 Creating new model entry...')
  
  const { data: newModel, error: insertError } = await supabase
    .from('models')
    .insert({
      name: profileData.identity.name,
      stage_name: profileData.identity.stage_name,
      voice_profile: profileData,
      archetype_tags: [
        profileData.archetype_assignment.primary,
        profileData.archetype_assignment.secondary
      ].filter(Boolean),
      niche_tags: profileData.content.niche_topics,
      explicitness_level: profileData.spicy.explicitness_level,
      boundaries: profileData.boundaries,
      transcript_summary: profileData.identity.quick_bio,
    })
    .select('id')
    .single()
  
  if (insertError) {
    console.error('❌ Insert failed:', insertError.message)
    process.exit(1)
  }
  
  console.log('✅ Anna added to database!')
  console.log(`   Model ID: ${newModel.id}`)
  console.log(`\n🚀 Go to http://localhost:3000/models/${newModel.id} to generate scripts!`)
}

importAnnaProfile().catch(console.error)

