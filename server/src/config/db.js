const admin = require('firebase-admin');
const fs = require('fs');
const firebase = require('firebase/compat/app');
require('firebase/compat/firestore');

let firestore;
let fieldValueProvider = admin.firestore.FieldValue;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getProjectId = () => (
  process.env.FIREBASE_PROJECT_ID
  || process.env.FIREBASE_WEB_PROJECT_ID
  || process.env.GCLOUD_PROJECT
  || process.env.GOOGLE_CLOUD_PROJECT
  || null
);

const buildCredential = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const raw = fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8');
    const serviceAccount = JSON.parse(raw);
    return admin.credential.cert(serviceAccount);
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(json);
    return admin.credential.cert(serviceAccount);
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    return admin.credential.cert(serviceAccount);
  }

  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    });
  }

  return null;
};

const getAccessTokenFromAdmin = async () => {
  const credential = admin.app().options?.credential;
  if (!credential || typeof credential.getAccessToken !== 'function') {
    throw new Error('Admin credential does not support access token retrieval.');
  }

  const tokenResult = await credential.getAccessToken();
  const token = typeof tokenResult === 'string' ? tokenResult : tokenResult?.access_token;
  if (!token) {
    throw new Error('Unable to obtain Google API access token from Admin credential.');
  }
  return token;
};

const waitForOperation = async (operationName, token) => {
  for (let i = 0; i < 20; i += 1) {
    const opUrl = `https://firestore.googleapis.com/v1/${operationName}`;
    const opRes = await fetch(opUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!opRes.ok) {
      const txt = await opRes.text();
      throw new Error(`Unable to query Firestore operation status (${opRes.status}): ${txt}`);
    }

    const opJson = await opRes.json();
    if (opJson.done) {
      if (opJson.error) {
        throw new Error(`Firestore create operation failed: ${JSON.stringify(opJson.error)}`);
      }
      return true;
    }

    await sleep(3000);
  }

  throw new Error('Timed out waiting for Firestore database creation operation.');
};

const tryAutoCreateFirestoreDatabase = async (projectId) => {
  const token = await getAccessTokenFromAdmin();
  const locationId = process.env.FIRESTORE_LOCATION || 'us-central1';
  const createUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases?databaseId=(default)`;

  const res = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'FIRESTORE_NATIVE',
      locationId
    })
  });

  if (res.status === 409) {
    return true;
  }

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Firestore auto-create failed (${res.status}): ${txt}`);
  }

  const data = await res.json();
  if (data.name) {
    await waitForOperation(data.name, token);
  }

  return true;
};

const connectDB = async () => {
  try {
    const projectId = getProjectId();
    const credential = buildCredential();

    if (credential) {
      if (!admin.apps.length) {
        const options = { credential };

        if (projectId) {
          options.projectId = projectId;
        }

        admin.initializeApp(options);
      }

      firestore = admin.firestore();
      const firestoreSettings = { preferRest: true };
      if (process.env.FIRESTORE_DATABASE_ID) {
        firestoreSettings.databaseId = process.env.FIRESTORE_DATABASE_ID;
      }
      firestore.settings(firestoreSettings);
      fieldValueProvider = admin.firestore.FieldValue;
    } else {
      const clientConfig = {
        apiKey: process.env.FIREBASE_WEB_API_KEY,
        authDomain: process.env.FIREBASE_WEB_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_WEB_PROJECT_ID || projectId,
        storageBucket: process.env.FIREBASE_WEB_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_WEB_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_WEB_APP_ID,
        measurementId: process.env.FIREBASE_WEB_MEASUREMENT_ID
      };

      if (!clientConfig.apiKey || !clientConfig.projectId || !clientConfig.appId) {
        throw new Error(
          'Firebase credentials are missing. Set Admin credentials (recommended) or FIREBASE_WEB_API_KEY/FIREBASE_WEB_PROJECT_ID/FIREBASE_WEB_APP_ID in .env'
        );
      }

      if (!firebase.apps.length) {
        firebase.initializeApp(clientConfig);
      }

      firestore = firebase.firestore();
      fieldValueProvider = firebase.firestore.FieldValue;

      console.warn('⚠️ Using Firebase Web SDK fallback (no Admin credentials).');
      console.warn('⚠️ Configure FIREBASE_SERVICE_ACCOUNT_* for production server usage.');
    }

    if (process.env.FIRESTORE_SKIP_HEALTHCHECK === 'true') {
      console.log('✅ Firestore initialized (health check skipped)');
      return;
    }

    try {
      await firestore.collection('_health').doc('connection-check').set(
        { updatedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
      console.log('✅ Firestore connected');
    } catch (healthErr) {
      console.warn('⚠️ Firestore initialized but health check failed:', healthErr.message);
      if (String(healthErr.message || '').includes('5 NOT_FOUND')) {
        console.warn('⚠️ Firestore database may not be created yet for this Firebase project.');

        if (process.env.FIRESTORE_AUTO_CREATE === 'true' && credential) {
          try {
            console.log('🔧 Attempting to auto-create default Firestore database...');
            await tryAutoCreateFirestoreDatabase(projectId);
            await firestore.collection('_health').doc('connection-check').set(
              { updatedAt: admin.firestore.FieldValue.serverTimestamp() },
              { merge: true }
            );
            console.log('✅ Firestore database created and connected');
            return;
          } catch (createErr) {
            console.warn('⚠️ Firestore auto-create failed:', createErr.message);
          }
        }

        console.warn('⚠️ Enable Firestore in the Firebase console if auto-create is unavailable.');
      } else {
        console.warn('⚠️ Firestore Admin credentials loaded, but the project is not yet accepting Firestore operations.');
      }
    }
  } catch (err) {
    console.error('❌ Firestore connection error:', err.message);
    process.exit(1);
  }
};

const getDb = () => {
  if (!firestore) {
    throw new Error('Firestore has not been initialized. Call connectDB() first.');
  }
  return firestore;
};

const serverTimestamp = () => {
  if (!fieldValueProvider || typeof fieldValueProvider.serverTimestamp !== 'function') {
    throw new Error('Firestore FieldValue provider is not initialized.');
  }
  return fieldValueProvider.serverTimestamp();
};

module.exports = { connectDB, getDb, serverTimestamp };
