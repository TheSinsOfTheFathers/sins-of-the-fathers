// Simple Sanity migration helper to convert old relationships array (name/status)
// into reference-based relationships: {character: {_ref: '<id>'}, status: '...'}
// Usage: set SANITY_PROJECT_ID, SANITY_DATASET, SANITY_TOKEN env vars, then run:
//   node ./scripts/migrateRelationshipsToReferences.js

const sanityClient = require('@sanity/client');

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET || 'production';
const token = process.env.SANITY_TOKEN; // required for write

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

async function findCharacterByName(name) {
    if (!name) return null;
    const q = `*[_type == "character" && (name == $name || name match $nameI)][0]{_id}`;
    const params = { name, nameI: `${name}*` };
    const res = await client.fetch(q, params);
    return res && res._id ? res._id : null;
}

async function run() {
    console.log('Fetching characters...');
    const docs = await client.fetch(`*[_type == "character"]{_id, relationships}`);
    for (const doc of docs) {
        const rels = doc.relationships || [];
        // filter entries that already have a 'character' ref
        const toConvert = rels.filter(r => r && !r.character && (r.name || r._ref || r._id));
        if (toConvert.length === 0) continue;

        const newRels = [];
        for (const r of rels) {
            if (r && r.character) {
                newRels.push(r);
                continue;
            }
            // try to resolve by name
            const name = r && r.name ? r.name : null;
            let refId = null;
            if (name) {
                refId = await findCharacterByName(name);
            }
            if (!refId && (r._ref || r._id)) refId = r._ref || r._id;

            if (refId) {
                newRels.push({ character: { _ref: refId }, status: r.status || '' });
            } else {
                // keep original as fallback but place in a 'legacy' field so we don't lose data
                newRels.push({ legacyName: r.name || null, status: r.status || '', _note: 'unresolved' });
            }
        }

        try {
            await client.patch(doc._id).set({ relationships: newRels }).commit({
                skipValidation: false
            });
            console.log('Patched', doc._id);
        } catch (err) {
            console.error('Failed to patch', doc._id, err.message || err);
        }
    }
    console.log('Migration complete.');
}

run().catch(err => { console.error(err); process.exit(1); });
