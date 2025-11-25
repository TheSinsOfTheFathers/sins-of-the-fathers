

const sanityClient = require('@sanity/client');

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET || 'production';
const token = process.env.SANITY_TOKEN;

if (!projectId || !token) {
  console.error('Please set SANITY_PROJECT_ID and SANITY_TOKEN environment variables.');
  process.exit(1);
}

const client = sanityClient({
  projectId,
  dataset,
  token,
  useCdn: false,
  apiVersion: '2025-01-01'
});

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .substring(0, 96);
}

async function run() {
  console.log('Querying characters with legacy Ad field and missing name...');
  const docs = await client.fetch(`*[_type == "character" && defined(Ad) && (!defined(name) || name == "")]{_id, Ad, slug}`);
  console.log(`Found ${docs.length} documents to migrate.`);

  for (const doc of docs) {
    const newName = doc.Ad;
    if (!newName) continue;

    const patch = { name: newName };
    if (!doc.slug || !doc.slug.current) {
      patch.slug = { current: slugify(newName) };
    }

    try {
      await client.patch(doc._id).set(patch).commit({ skipValidation: false });
      console.log(`Patched ${doc._id} -> name: "${newName}"${patch.slug ? `, slug: ${patch.slug.current}` : ''}`);
    } catch (err) {
      console.error(`Failed to patch ${doc._id}:`, err.message || err);
    }
  }

  console.log('Migration complete. Review the Studio for results and publish any drafts as needed.');
}

run().catch(err => { console.error(err); process.exit(1); });
