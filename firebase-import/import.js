const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = require('./sins-of-the-fathers-9a2ad82d36a2.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const importCollection = async (collectionName, fileName) => {
  try {
    console.log(`Importing ${collectionName}...`);
    const rawData = fs.readFileSync(fileName);
    const data = JSON.parse(rawData);

    for (const docId in data) {
      if (data.hasOwnProperty(docId)) {
        await db.collection(collectionName).doc(docId).set(data[docId]);
      }
    }
    console.log(`${collectionName} imported successfully!`);
  } catch (error) {
    console.error(`Error importing ${collectionName}:`, error);
  }
};

const runImport = async () => {
  await importCollection('family', 'family.json');
  console.log('All data imported.');
  process.exit(0);
};

runImport();