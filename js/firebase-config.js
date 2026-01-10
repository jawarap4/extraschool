// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDZKo3kZDMXxj_VFbKpp85KTB5TA8BI0s0",
  authDomain: "exschool-6ea50.firebaseapp.com",
  projectId: "exschool-6ea50",
  storageBucket: "exschool-6ea50.appspot.com",
  messagingSenderId: "301472703424",
  appId: "1:301472703424:web:c1d8f6fe4d9b7191641e25",
  measurementId: "G-ABCDEF1234"
};

// Initialize Firebase v8 (Compatible)
console.log("Initializing Firebase v8...");

// Pastikan Firebase sudah di-load
if (typeof firebase !== 'undefined') {
  const app = firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage();
  
  console.log("Firebase initialized successfully!");
  
  // Export untuk penggunaan global
  window.firebaseApp = app;
  window.firebaseAuth = auth;
  window.firebaseDb = db;
  window.firebaseStorage = storage;
} else {
  console.error("Firebase SDK not loaded! Check script order.");
}
[file content end]