/* eslint-env node */
/* global process, console */
import { createClient } from '@sanity/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const client = createClient({
  projectId: '8cfeoaz2',
  dataset: 'production',
  token: process.env.SANITY_AUTH_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

async function importCharacters() {
  try {
    // JSON dosyasını oku (opsiyonel: ilk arg olarak başka bir dosya verebilirsiniz)
    const jsonPath = path.join(__dirname, process.argv[2] || '../factions-data.json')
    const jsonData = fs.readFileSync(jsonPath, 'utf-8')
    const parsed = JSON.parse(jsonData)

    let items = []
    let itemType = 'character'
    if (Array.isArray(parsed)) {
      items = parsed
    } else if (parsed && Array.isArray(parsed.characters)) {
      items = parsed.characters
      itemType = 'character'
    } else if (parsed && Array.isArray(parsed.factions)) {
      items = parsed.factions
      itemType = 'faction'
    } else {
      throw new Error('Beklenen `characters` veya `factions` dizisi bulunamadı.')
    }

    console.log(`${items.length} ${itemType} import etmeye başlanıyor...`)

    const DRY_RUN = !process.env.SANITY_AUTH_TOKEN
    if (DRY_RUN) console.warn('SANITY_AUTH_TOKEN yok — dry-run modunda çalışıyor. Hiçbir yazma işlemi yapılmayacak.')

    let successCount = 0
    let errorCount = 0

    for (const character of items) {
      try {
        // Slug'ın benzersiz olduğundan emin ol
        const slug =
          typeof character.slug === 'string'
            ? character.slug
            : character.slug && character.slug.current
            ? character.slug.current
            : (character.title || character.name || '')
                .toString()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')

        if (!slug) throw new Error('Slug hesaplanamadı (isim veya slug yok).')

        let existingDoc = []
        if (!DRY_RUN) {
          existingDoc = await client.fetch(
            `*[_type == $type && slug.current == $slug]`,
            { type: itemType, slug }
          )
        }

        let sanityDoc = null
        if (itemType === 'character') {
          sanityDoc = {
            _type: 'character',
            _id: `character-${slug}`,
            name: character.name,
            slug: { _type: 'slug', current: slug },
            alias: character.alias,
            title: character.title,
            description: character.description,
            status: character.status,
            origin: character.origin,
            is_main: character.is_main,
            image: character.image,
            quote: character.quote,
            story: character.story,
            relationships: character.relationships,
            family: character.family,
            familyTree: character.familyTree,
          }
        } else {
          // faction
          sanityDoc = {
            _type: 'faction',
            _id: `faction-${slug}`,
            title: character.title || character.name,
            slug: { _type: 'slug', current: slug },
            type: character.type || 'syndicate',
            hq: character.hq || '',
            hqLocation: character.hqLocation || null,
            threatLevel: character.threatLevel || 'medium',
            status: character.status || 'active',
            color: character.color || null,
            image: character.image || null,
            icon: character.icon || null,
            motto: character.motto || '',
            summary: character.summary || '',
            description: character.description || [],
            philosophy: character.philosophy || '',
            economy: character.economy || '',
            relations: character.relations || [],
            leader: character.leader || null,
            territory: character.territory || null,
          }
        }

        if (!DRY_RUN) {
          if (existingDoc && existingDoc.length > 0) {
            await client.patch(existingDoc[0]._id).set(sanityDoc).commit()
            console.log(`✓ Güncellendi: ${sanityDoc.title || sanityDoc.name}`)
          } else {
            await client.create(sanityDoc)
            console.log(`✓ Eklendi: ${sanityDoc.title || sanityDoc.name}`)
          }
        } else {
          if (existingDoc && existingDoc.length > 0) {
            console.log(`DRY RUN ✓ Güncellenecek: ${sanityDoc.title || sanityDoc.name}`)
          } else {
            console.log(`DRY RUN ✓ Eklenecek: ${sanityDoc.title || sanityDoc.name}`)
          }
        }

        successCount++
      } catch (error) {
        console.error(`✗ Hata: ${character.name} - ${error.message}`)
        errorCount++
      }
    }

    console.log(`\n=== İmport Tamamlandı ===`)
    console.log(`Başarılı: ${successCount}`)
    console.log(`Hata: ${errorCount}`)
    console.log(`Toplam: ${items.length}`)
  } catch (error) { 
    console.error('İmport hatası:', error)
    process.exit(1)
  }
}

importCharacters()
