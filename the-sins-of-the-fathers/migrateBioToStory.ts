// migrateBioToStory.ts

import {createClient} from '@sanity/client'

// Kendi proje bilgilerinizi kullanarak bir istemci oluşturun
const client = createClient({
  projectId: '8cfeoaz2',
  dataset: 'production',
  useCdn: false, // Mutlaka false olmalı ki en güncel veriyi görelim
  apiVersion: '2024-11-10',
  // Değişiklik yapabilmek için bir token'a ihtiyacımız var.
  // Bu token'ı komut satırından sağlayacağız.
  token: process.env.SANITY_MIGRATE_TOKEN 
})

// 1. İçinde "bio" alanı olan TÜM karakterleri bul
const fetchDocuments = () => client.fetch(`*[_type == 'character' && defined(bio)][0...100]`)

// 2. Her bir karakter için veriyi taşı
const buildPatches = (docs: any[]) =>
  docs.map((doc) => ({
    id: doc._id,
    patch: {
      // 'story' alanını 'bio' alanının değeriyle ayarla
      set: {story: doc.bio},
      // Artık gereksiz olan 'bio' alanını kaldır
      unset: ['bio'],
    },
  }))

const createTransaction = (patches: any[]) =>
  patches.reduce((tx, patch) => tx.patch(patch.id, patch.patch), client.transaction())

const migrateNextBatch = async () => {
  const documents = await fetchDocuments()
  if (documents.length === 0) {
    console.log('No more documents to migrate!')
    return null
  }
  const patches = buildPatches(documents)
  const transaction = createTransaction(patches)
  await transaction.commit()
  return migrateNextBatch()
}

migrateNextBatch().catch((err) => {
  console.error(err)
  process.exit(1)
})