import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import dotenv from "dotenv";

dotenv.config();
const firebaseConfig = {
  apiKey: "AIzaSyDd5e7NCoIo9qiHta5uk8B_ILowF69adnI",
  authDomain: "dhaaba-fusion-be.firebaseapp.com",
  projectId: "dhaaba-fusion-be",
  storageBucket: "dhaaba-fusion-be.appspot.com",
  messagingSenderId: "275355080355",
  appId: "1:275355080355:web:097ef6f0880dda55e91116",
  measurementId: "G-2P9P9F34PE"
};
//Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);  

export { app, auth, storage };