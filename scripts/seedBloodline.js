import { initializeApp } from 'firebase-admin/app';
import { createEntity, createLink } from '@dataconnect/admin-generated';

// Setup explicit emulator host for locally running operations
process.env.DATA_CONNECT_EMULATOR_HOST = "127.0.0.1:9400";
process.env.FIREBASE_DATA_CONNECT_EMULATOR_HOST = "127.0.0.1:9400";
process.env.GCLOUD_PROJECT = "sins-of-the-fathers";

// Initialize dummy Firebase Admin app
initializeApp({ projectId: "sins-of-the-fathers" });

async function seed() {
  console.log("Seeding Entities...");
  await createEntity({ id: "don-vittorio", name: "Don Vittorio", role: "Patriarch", threatLevel: "CRITICAL", status: "ACTIVE" });
  await createEntity({ id: "angelo", name: "Angelo 'The Razor'", role: "Caporegime", threatLevel: "HIGH", status: "ACTIVE" });
  await createEntity({ id: "salvatore", name: "Salvatore", role: "Soldato", threatLevel: "MEDIUM", status: "DECEASED" });
  await createEntity({ id: "don-luigi", name: "Don Luigi", role: "Rival Boss", threatLevel: "CRITICAL", status: "ACTIVE" });
  await createEntity({ id: "isabella", name: "Isabella", role: "Underboss", threatLevel: "HIGH", status: "ACTIVE" });
  await createEntity({ id: "marco", name: "Marco", role: "Associate", threatLevel: "LOW", status: "ACTIVE" });

  console.log("Seeding Limits / Relationships...");
  await createLink({ id: "link-1", source: "don-vittorio", target: "angelo", relationType: "BIOLOGICAL" });
  await createLink({ id: "link-2", source: "don-vittorio", target: "isabella", relationType: "BIOLOGICAL" });
  await createLink({ id: "link-3", source: "angelo", target: "salvatore", relationType: "BIOLOGICAL" });
  await createLink({ id: "link-4", source: "don-vittorio", target: "don-luigi", relationType: "RIVAL" });
  await createLink({ id: "link-5", source: "don-luigi", target: "marco", relationType: "BLOOD_OATH" });
  await createLink({ id: "link-6", source: "isabella", target: "don-luigi", relationType: "RIVAL" });

  console.log("Seeding Completed Successfully!");
}

seed().catch(err => {
  console.error("Error Seeding Data Connect:");
  console.error(err);
});
