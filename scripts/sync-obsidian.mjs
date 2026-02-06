import { createClient } from '@sanity/client';
import matter from 'gray-matter';
import fs from 'fs';
import path from 'path';
import slugify from 'slugify';

const client = createClient({
  projectId: '8cfeoaz2',
  dataset: 'production',
  useCdn: false,
  token: process.env.SANITY_AUTH_TOKEN,
  apiVersion: '2023-05-03',
});

const target = process.env.SYNC_TARGET; // GitHub'dan gelen seçim
const isDryRun = process.env.DRY_RUN === 'true';

const folderMap = {
  'Characters': { path: 'vault/Characters', type: 'character' },
  'Lore': { path: 'vault/Lore', type: 'lore' },
  'Timeline': { path: 'vault/Timeline', type: 'timeline' }
};

async function syncFolder(folderName) {
  const config = folderMap[folderName];
  if (!config) return;

  console.log(`🔎 Scanning ${folderName}...`);
  const fullPath = path.resolve(config.path);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Folder not found: ${fullPath}`);
    return;
  }

  const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const fileContent = fs.readFileSync(path.join(fullPath, file), 'utf-8');
    const { data, content } = matter(fileContent);

    const doc = {
      _type: config.type,
      _id: `obsidian-${slugify(data.name || file, { lower: true, strict: true })}`,
      name: data.name,
      slug: { _type: 'slug', current: data.slug || slugify(data.name || file, { lower: true, strict: true }) },
      // Şemana göre diğer alanları buraya ekle (alias, status vb.)
      story: [{ _type: 'block', children: [{ _type: 'span', text: content }] }], // Basit çeviri
    };

    if (isDryRun) {
      console.log(`🧪 [Dry Run] Would sync: ${doc.name}`);
    } else {
      await client.createOrReplace(doc);
      console.log(`✅ Synced: ${doc.name}`);
    }
  }
}

// Seçime göre çalıştır
if (target === 'ALL') {
  for (const key of Object.keys(folderMap)) await syncFolder(key);
} else {
  await syncFolder(target);
}