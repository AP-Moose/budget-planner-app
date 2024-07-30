// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDwm8smy8I5qC5MbIVBO2_jfMq9TluT_SM",
  authDomain: "budget-planner-app-ef6f8.firebaseapp.com",
  projectId: "budget-planner-app-ef6f8",
  storageBucket: "budget-planner-app-ef6f8.appspot.com",
  messagingSenderId: "194347746415",
  appId: "1:194347746415:web:537dcb441d442cb6eff99a",
  measurementId: "G-LW09PSZD4N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
  export default firebaseConfig;