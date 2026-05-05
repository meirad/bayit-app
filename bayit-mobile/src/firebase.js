import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyA7gMrWlGMadOu-rlGwsLjgtS_77FQpTb4',
  authDomain: 'applcation-codes.firebaseapp.com',
  projectId: 'applcation-codes',
  storageBucket: 'applcation-codes.firebasestorage.app',
  messagingSenderId: '398448454974',
  appId: '1:398448454974:web:7d41c36704804af2e7d06f',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
