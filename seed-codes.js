/**
 * seed-codes.js
 * Adds all property codes under the household of a given email.
 * Usage: node seed-codes.js [email]
 * Default email: test@test.com
 */

require('dotenv').config();
const admin = require('firebase-admin');

const TARGET_EMAIL = process.argv[2] || 'test@test.com';

// ── Raw codes list ─────────────────────────────────────────────────────────
// Each entry: { name, codes: [{ label, value }, ...] }
// Entries with a single unnamed code use label "Code".

const RAW_PROPERTIES = [
  { name: 'Sharifian (Shneller)',         codes: [{ label: 'Code', value: '135' }] },
  { name: 'Sderot Eshkol 16',             codes: [{ label: 'Code', value: 'C1370Y' }] },
  { name: 'Silver (Stax)',                codes: [{ label: 'Code', value: '2590z' }] },
  { name: 'Gold (Stax)',                  codes: [{ label: 'Code', value: '2590y' }] },
  { name: 'Shpitzer 7th floor apt 32',    codes: [{ label: 'Code', value: '2490y' }, { label: 'Building 1', value: '3582#' }] },
  { name: 'Sharifian apt 19 4flr',        codes: [{ label: 'Code', value: '135' }] },
  { name: '1 Bedroom (Stax)',             codes: [{ label: 'Code', value: '6790z' }] },
  { name: '2 Bedroom (Stax)',             codes: [{ label: 'Code', value: '3570z' }] },
  { name: 'Greyson apt 22 flr 5',         codes: [{ label: 'Code', value: '1267x' }] },
  { name: '-3 Machsan',                   codes: [{ label: 'Code', value: '13790' }] },
  { name: 'Hakablan 59',                  codes: [{ label: 'Code', value: '1267y' }] },
  { name: 'Rothschild',                   codes: [{ label: 'Code', value: '534' }] },
  { name: "Mendy's apt 10",               codes: [{ label: 'Code', value: '13689' }] },
  { name: "Mendy's apt 7",                codes: [{ label: 'Code', value: '13689' }] },
  { name: 'Givat Moshe',                  codes: [{ label: 'Code', value: '1568y' }] },
  { name: 'Kaduri',                       codes: [{ label: 'Code', value: '1694x' }] },
  { name: 'Rav Apt',                      codes: [{ label: 'Code', value: '1267' }, { label: 'Outside door', value: '67890' }] },
  { name: 'Shafaram',                     codes: [{ label: 'Code', value: '1280z' }, { label: 'Alarm', value: '1984' }] },
  { name: 'Arzieh Habira Gimmel',         codes: [{ label: 'Code', value: '2184x' }] },
  {
    name: 'Radak',
    codes: [
      { label: 'Main door', value: '134' },
      { label: 'Outside gate', value: '2652#' },
      { label: 'Master bedroom', value: '124' },
      { label: 'Downstairs door', value: 'C1290z' }
    ]
  },
  { name: 'Sderot Eshkol 12',             codes: [{ label: 'Code', value: 'C2389y' }, { label: 'Outside gate', value: '3636#' }] },
  {
    name: 'Agan',
    codes: [
      { label: 'Code', value: '1-5 3' },
      { label: 'Parking door', value: '5784' },
      { label: 'Maksan', value: '2478x' }
    ]
  },
  { name: 'Beren Shalem',                 codes: [{ label: 'Code', value: '242424' }] },
  { name: 'Sderot Eshkol 22',             codes: [{ label: 'Outside door', value: '1368' }, { label: 'Code', value: '1634#' }] },
  { name: 'Shalem Stimler',               codes: [{ label: 'Code', value: '1267z' }, { label: 'Machsan', value: 'C1670x' }] },
  { name: 'Shalem 7th FL apt 32',         codes: [{ label: 'Code', value: '1352' }, { label: 'Maksan', value: '4578y' }] },
  { name: 'Shaulzon 86',                  codes: [{ label: 'Code', value: 'c1270y' }] },
  { name: 'Nachal Tzin',                  codes: [{ label: 'Code', value: '8888' }, { label: 'Code 2', value: 'c12345' }] },
  { name: 'Building 1 Shneller',          codes: [{ label: 'Code', value: '5792' }] },
  { name: 'Moskovitz 3rd floor',          codes: [{ label: 'Code', value: '3490y' }] },
  { name: 'Diskin',                       codes: [{ label: 'Code', value: '12895' }, { label: 'Note', value: 'key' }] },
  { name: 'Shneller -3 Maksan',           codes: [{ label: 'Code', value: '13790' }] },
  { name: 'Office Alarm',                 codes: [{ label: 'Alarm', value: '1580' }] },
  { name: 'Office Main Door',             codes: [{ label: 'Code', value: '4680' }] },
  { name: 'Office Side Door',             codes: [{ label: 'Code', value: '3829' }] },
  { name: 'Zeigler apt 24 B5',            codes: [{ label: 'Code', value: 'C4570z' }] },
  { name: 'Sheshet Hayamim 6 apt 20',     codes: [{ label: 'Code', value: '1638z' }] },
  { name: 'Sheshet Hayamim 19',           codes: [{ label: 'Outside gate', value: 'C1234y' }] },
  { name: 'Nachal Tzin apt 21',           codes: [{ label: 'Code', value: 'C2345z' }, { label: 'Machsan', value: 'C8491x' }] },
  { name: 'Maavar Hamitler 3',            codes: [] },
  { name: 'Machal 20',                    codes: [{ label: 'Code', value: 'C5204y' }] },
  { name: 'Shneller Building',            codes: [{ label: 'Code', value: '9505#' }] },
  { name: 'Brach 2 bdrm apt 35',          codes: [{ label: 'Code', value: 'C613x' }] },
  { name: 'Brach 3 bdrm apt 34',          codes: [{ label: 'Code', value: 'c246x' }] },
  { name: 'Yam Suf 1',                    codes: [{ label: 'Code', value: '2513' }] },
  { name: 'JE1201',                       codes: [{ label: 'Code', value: '1267x' }] },
  { name: 'Machsan',                      codes: [{ label: 'Code', value: '67890' }] },
];

// ── Firebase init ──────────────────────────────────────────────────────────
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    }),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}

const db = admin.firestore();
const dbId = process.env.FIRESTORE_DATABASE_ID;
if (dbId) db.settings({ preferRest: true, databaseId: dbId });
else db.settings({ preferRest: true });

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Looking up user: ${TARGET_EMAIL}`);

  const usersSnap = await db.collection('users').where('email', '==', TARGET_EMAIL).limit(1).get();
  if (usersSnap.empty) {
    console.error(`No user found with email ${TARGET_EMAIL}. Register the account first.`);
    process.exit(1);
  }

  const userDoc = usersSnap.docs[0];
  const { householdId } = userDoc.data();
  if (!householdId) {
    console.error('User has no householdId. Something is wrong with the account.');
    process.exit(1);
  }

  console.log(`Found user ${userDoc.id} → householdId: ${householdId}`);

  // Delete existing properties for this household to avoid duplicates
  const existing = await db.collection('properties').where('householdId', '==', householdId).get();
  if (!existing.empty) {
    console.log(`Deleting ${existing.docs.length} existing properties…`);
    const delBatch = db.batch();
    existing.docs.forEach((d) => delBatch.delete(d.ref));
    await delBatch.commit();
  }

  // Write in batches of 500 (Firestore limit)
  const now = admin.firestore.FieldValue.serverTimestamp();
  const BATCH_SIZE = 499;
  let batch = db.batch();
  let count = 0;

  for (const prop of RAW_PROPERTIES) {
    const ref = db.collection('properties').doc();
    batch.set(ref, {
      name: prop.name,
      codes: prop.codes,
      householdId,
      createdAt: now,
      updatedAt: now
    });
    count++;

    if (count % BATCH_SIZE === 0) {
      await batch.commit();
      console.log(`  Committed ${count} so far…`);
      batch = db.batch();
    }
  }

  await batch.commit();
  console.log(`\n✅ Seeded ${count} properties for ${TARGET_EMAIL} (householdId: ${householdId})`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
