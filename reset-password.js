require('dotenv').config();
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');

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

async function run() {
  const email = process.argv[2];
  const newPassword = process.argv[3];
  if (!email || !newPassword) { console.error('Usage: node reset-password.js <email> <password>'); process.exit(1); }

  const snap = await db.collection('users').where('email', '==', email).limit(1).get();
  if (snap.empty) { console.error('User not found:', email); process.exit(1); }

  const hash = await bcrypt.hash(newPassword, 12);
  await snap.docs[0].ref.update({ passwordHash: hash });
  console.log(`✅ Password updated for ${email}`);
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
