// ✅ Import Firebase SDK Modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// ✅ Firebase Configuration (Same as in index.html)
const firebaseConfig = {
    apiKey: "AIzaSyCq3zbJxgSw-tkb37LGWBEKKwbfM909Nb0",
    authDomain: "multiuser-quizzz.firebaseapp.com",
    projectId: "multiuser-quizzz",
    storageBucket: "multiuser-quizzz.appspot.com",
    messagingSenderId: "428669773909",
    appId: "1:428669773909:web:585fa472d5b32ea2a78cdc",
    measurementId: "G-GWT1R0MQZE"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ Start Quiz Button Logic
document.getElementById("start-quiz-btn").addEventListener("click", function () {
    const username = document.getElementById("username").value.trim();
    if (username === "") {
        alert("Please enter your name.");
        return;
    }
    localStorage.setItem("currentUser", username);
    document.getElementById("user-login").style.display = "none";
    document.querySelector(".quiz-wrapper").style.display = "block";
    loadQuestion();
});

// ✅ Quiz Logic
let currentQuestion = 0;
let score = 0;
let timeLeft = 30;
let timerInterval;

const timerEl = document.getElementById('time');
const questionEl = document.getElementById('question');
const optionsEl = document.querySelector('.options');
const resultEl = document.querySelector('.result');
const restartBtn = document.querySelector('.restart-btn');
const leaderboardList = document.getElementById("leaderboard-list");

// ✅ Load and Display Quiz Questions
function loadQuestion() {
    if (currentQuestion >= quizData.length) {
        endQuiz();
        return;
    }
    clearInterval(timerInterval);
    timeLeft = 30;
    timerEl.textContent = timeLeft;
    startTimer();

    const currentQuiz = quizData[currentQuestion];
    questionEl.textContent = `Q${currentQuestion + 1}: ${currentQuiz.question}`;
    optionsEl.innerHTML = '';

    currentQuiz.options.forEach(option => {
        const button = document.createElement('button');
        button.classList.add('option');
        button.textContent = option;
        button.onclick = () => checkAnswer(option);
        optionsEl.appendChild(button);
    });
}

function checkAnswer(selectedOption) {
    if (selectedOption === quizData[currentQuestion].answer) {
        score++;
    }
    currentQuestion++;
    loadQuestion();
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        timerEl.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            endQuiz();
        }
    }, 1000);
}

// ✅ Store Score in Firestore
async function endQuiz() {
    clearInterval(timerInterval);
    const username = localStorage.getItem("currentUser");

    try {
        await addDoc(collection(db, "leaderboard"), {
            user: username,
            score: score,
            timestamp: serverTimestamp()
        });
        console.log("Score saved to Firestore!");
    } catch (error) {
        console.error("Error saving score:", error);
    }

    questionEl.style.display = 'none';
    optionsEl.style.display = 'none';
    resultEl.innerHTML = `<strong>${username}'s Score:</strong> <span id="score">${score}</span> / ${quizData.length}`;
    resultEl.style.display = 'block';
    restartBtn.style.display = 'block';

    loadLeaderboard();  // Load leaderboard after storing new score
}

// ✅ Load Leaderboard from Firestore
async function loadLeaderboard() {
    leaderboardList.innerHTML = "Loading...";
    leaderboardList.innerHTML = "";

    const q = query(collection(db, "leaderboard"), orderBy("score", "desc"));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
        const entry = document.createElement("li");
        entry.textContent = `${doc.data().user}: ${doc.data().score}`;
        leaderboardList.appendChild(entry);
    });
}

// ✅ Clear Leaderboard (Admin Only)
document.getElementById("clear-leaderboard-btn").addEventListener("click", async function () {
    if (confirm("Are you sure you want to clear the leaderboard?")) {
        const querySnapshot = await getDocs(collection(db, "leaderboard"));
        querySnapshot.forEach(async (doc) => {
            await doc.ref.delete();
        });
        loadLeaderboard();  // Refresh leaderboard
    }
});

restartBtn.addEventListener("click", () => {
    currentQuestion = 0;
    score = 0;
    timeLeft = 30;
    questionEl.style.display = 'block';
    optionsEl.style.display = 'block';
    resultEl.style.display = 'none';
    restartBtn.style.display = 'none';
    loadQuestion();
});

loadQuestion();
loadLeaderboard();  // Load leaderboard on page load
