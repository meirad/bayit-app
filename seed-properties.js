require('dotenv').config();
const { connectDB, getDb, admin } = require('./server/src/config/db');

const PROPERTIES = [
  { name: 'Sharifian (Shneller)', codes: [{ label: 'Code', value: '135' }] },
  { name: 'Sderot Eshkol 16', codes: [{ label: 'Code', value: 'C1370Y' }] },
  { name: 'Silver (Stax)', codes: [{ label: 'Code', value: '2590z' }] },
  { name: 'Gold (Stax)', codes: [{ label: 'Code', value: '2590y' }] },
  { name: 'Shpitzer 7th floor apt 32', codes: [{ label: 'Code', value: '2490y' }, { label: 'Building', value: '3582#' }] },
  { name: 'Sharifian apt 19 4th floor', codes: [{ label: 'Code', value: '135' }] },
  { name: '1 bedroom (Stax)', codes: [{ label: 'Code', value: '6790z' }] },
  { name: '2 bedroom (Stax)', codes: [{ label: 'Code', value: '3570z' }] },
  { name: 'Greyson apt 22 flr 5', codes: [{ label: 'Code', value: '1267x' }] },
  { name: '-3 Machsan', codes: [{ label: 'Code', value: '13790' }] },
  { name: 'Hakablan 59', codes: [{ label: 'Code', value: '1267y' }] },
  { name: 'Rothschild', codes: [{ label: 'Code', value: '534' }] },
  { name: "Mendy's apt 10", codes: [{ label: 'Code', value: '13689' }] },
  { name: "Mendy's apt 7", codes: [{ label: 'Code', value: '13689' }] },
  { name: 'Givat Moshe', codes: [{ label: 'Code', value: '1568y' }] },
  { name: 'Kaduri', codes: [{ label: 'Code', value: '1694x' }] },
  { name: 'Rav apt', codes: [{ label: 'Main', value: '1267' }, { label: 'Outside door', value: '67890' }] },
  { name: 'Shafaram', codes: [{ label: 'Code', value: '1280z' }, { label: 'Alarm', value: '1984' }] },
  { name: 'Arzieh Habira Gimmel', codes: [{ label: 'Code', value: '2184x' }] },
  {
    name: 'Radak',
    codes: [
      { label: 'Main door', value: '134' },
      { label: 'Outside gate', value: '2652#' },
      { label: 'Master bedroom', value: '124' },
      { label: 'Downstairs door', value: 'C1290z' }
    ]
  },
  {
    name: 'Sderot Eshkol 12',
    codes: [{ label: 'Code', value: 'C2389y' }, { label: 'Outside gate', value: '3636#' }]
  },
  {
    name: 'Agan 1-5 3',
    codes: [{ label: 'Parking door', value: '5784' }, { label: 'Machsan', value: '2478x' }]
  },
  { name: 'Beren Shalem', codes: [{ label: 'Code', value: '242424' }] },
  {
    name: 'Sderot Eshkol 22',
    codes: [{ label: 'Outside door', value: '1368' }, { label: 'Gate', value: '1634#' }]
  },
  {
    name: 'Shalem Stimler',
    codes: [{ label: 'Code', value: '1267z' }, { label: 'Machsan', value: 'C1670x' }]
  },
  {
    name: 'Shalem 7th FL apt 32',
    codes: [{ label: 'Code', value: '1352' }, { label: 'Machsan', value: '4578y' }]
  },
  { name: 'Shaulzon 86', codes: [{ label: 'Code', value: 'C1270y' }] },
  { name: 'Nachal Tzin', codes: [{ label: 'Code 1', value: '8888' }, { label: 'Code 2', value: 'C12345' }] },
  { name: 'Building 1 Shneller', codes: [{ label: 'Code', value: '5792' }] },
  { name: 'Moskovitz 3rd floor', codes: [{ label: 'Code', value: '3490y' }] },
  { name: 'Diskin', codes: [{ label: 'Code', value: '12895' }], notes: '+ key required' },
  { name: 'Shneller -3 Machsan', codes: [{ label: 'Code', value: '13790' }] },
  { name: 'Office', codes: [{ label: 'Alarm', value: '1580' }, { label: 'Main door', value: '4680' }, { label: 'Side door', value: '3829' }] },
  { name: 'Zeigler apt 24 B5', codes: [{ label: 'Code', value: 'C4570z' }] },
  { name: 'Sheshet Hayamim 6 apt 20', codes: [{ label: 'Code', value: '1638z' }] },
  { name: 'Sheshet Hayamim 19', codes: [{ label: 'Outside gate', value: 'C1234y' }] },
  {
    name: 'Nachal Tzin apt 21',
    codes: [{ label: 'Code', value: 'C2345z' }, { label: 'Machsan', value: 'C8491x' }]
  },
  { name: 'Maavar Hamitler 3', codes: [] },
  { name: 'Machal 20', codes: [{ label: 'Code', value: 'C5204y' }] },
  { name: 'Shneller Building', codes: [{ label: 'Code', value: '9505#' }] },
  { name: 'Brach 2 bdrm apt 35', codes: [{ label: 'Code', value: 'C613x' }] },
  { name: 'Brach 3 bdrm apt 34', codes: [{ label: 'Code', value: 'C246x' }] },
  { name: 'Yam Suf 1', codes: [{ label: 'Code', value: '2513' }] },
  { name: 'JE1201', codes: [{ label: 'Code', value: '1267x' }, { label: 'Machsan', value: '67890' }] }
];

async function seed() {
  await connectDB();
  const db = getDb();
  console.log('Connected to Firestore');

  let householdId = process.env.SEED_HOUSEHOLD_ID || null;

  if (!householdId && process.env.SEED_USER_EMAIL) {
    const userQuery = await db
      .collection('users')
      .where('email', '==', process.env.SEED_USER_EMAIL)
      .limit(1)
      .get();
    if (!userQuery.empty) {
      householdId = userQuery.docs[0].data().householdId || null;
    }
  }

  if (!householdId) {
    const householdQuery = await db.collection('households').limit(1).get();
    if (!householdQuery.empty) {
      householdId = householdQuery.docs[0].id;
    }
  }

  if (!householdId) {
    const householdRef = await db.collection('households').add({
      name: 'Default Household',
      members: [],
      currency: 'ILS',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    householdId = householdRef.id;
    console.log(`Created default household ${householdId}`);
  }

  const existingQuery = await db.collection('properties').where('householdId', '==', householdId).get();
  const existing = existingQuery.size;

  if (existing > 0) {
    console.log(`${existing} properties already exist for household ${householdId} — skipping seed. Run with --force to overwrite.`);
    if (!process.argv.includes('--force')) {
      return;
    }

    const deleteBatch = db.batch();
    existingQuery.docs.forEach((doc) => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();
    console.log('Cleared existing properties.');
  }

  const createBatch = db.batch();
  PROPERTIES.forEach((property) => {
    const ref = db.collection('properties').doc();
    createBatch.set(ref, {
      householdId,
      name: property.name,
      codes: property.codes || [],
      notes: property.notes || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  await createBatch.commit();
  console.log(`✅ Seeded ${PROPERTIES.length} properties for household ${householdId}.`);
}

seed().catch((err) => { console.error(err); process.exit(1); });
