const API_KEY = "AIzaSyAQ312Xa44W7vjdm8Z83uJBziheKMRJh7U"; // 🔑 ← ここを自分のAPIキーに！

let triggered = false;
let recognizing = true;

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'ja-JP';
recognition.continuous = true;
recognition.interimResults = false;

const statusEl = document.getElementById('status');
const chatLog = document.getElementById('chat-log');
const form = document.getElementById('chat-form');
const input = document.getElementById('chat-input');
const stopBtn = document.getElementById('stop-btn');
const startBtn = document.getElementById('start-btn');
const clearBtn = document.getElementById('clear-btn');
const avatar = document.getElementById('avatar');

recognition.onresult = async (event) => {
  const text = event.results[event.results.length - 1][0].transcript.trim();
  if (!triggered) {
    if (text.includes("へい") && text.includes("トト")) {
      triggered = true;
      speak("はい、どうぞ");
      statusEl.textContent = "ステータス: 起動しました";
    }
    return;
  }

  await handleMessage(text);
  triggered = false;
  statusEl.textContent = "ステータス: 待機中";
};

recognition.onerror = (e) => console.error("音声認識エラー:", e);
recognition.onend = () => {
  if (recognizing) recognition.start();
};

recognition.start();

// --- Gemini API ---
async function askGemini(message) {
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + API_KEY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: message }] }]
    }),
  });

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "すみません、理解できませんでした。";
}

// --- 音声読み上げ + アバター動作 ---
function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "ja-JP";
  utter.onstart = () => avatar.classList.add("talking");
  utter.onend = () => avatar.classList.remove("talking");
  speechSynthesis.speak(utter);
}

// --- メッセージ処理 ---
async function handleMessage(message) {
  appendMessage("user", message);
  const reply = await askGemini(message);
  appendMessage("bot", reply);
  speak(reply);
  saveHistory();
}

// --- 表示処理 ---
function appendMessage(role, text) {
  const p = document.createElement("p");
  p.className = role;
  p.innerHTML = (role === "user" ? "👤 あなた: " : "🤖 トト: ") + text;
  chatLog.appendChild(p);
  chatLog.scrollTop = chatLog.scrollHeight;
}

// --- 入力送信処理 ---
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  await handleMessage(text);
});

// --- ローカル保存・復元 ---
function saveHistory() {
  localStorage.setItem("toto-chat-log", chatLog.innerHTML);
}

function loadHistory() {
  const saved = localStorage.getItem("toto-chat-log");
  if (saved) chatLog.innerHTML = saved;
}

// --- 操作ボタン ---
stopBtn.onclick = () => {
  recognition.stop();
  recognizing = false;
  statusEl.textContent = "ステータス: 音声停止中";
};

startBtn.onclick = () => {
  recognizing = true;
  recognition.start();
  statusEl.textContent = "ステータス: 待機中";
};

clearBtn.onclick = () => {
  chatLog.innerHTML = "";
  localStorage.removeItem("toto-chat-log");
};

// 初回ロード
loadHistory();
