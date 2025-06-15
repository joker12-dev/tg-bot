require('dotenv').config();
const fs = require('fs');
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const SHARED_SECRET = process.env.SHARED_SECRET;
const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// ✅ Doğrulanan kullanıcıları kalıcı olarak saklayan JSON dosyası
const VERIFIED_USERS_FILE = 'verified_users.json';
let verifiedUsers = new Set();

// 🔄 Başlangıçta dosyadan kullanıcıları oku
if (fs.existsSync(VERIFIED_USERS_FILE)) {
  const data = fs.readFileSync(VERIFIED_USERS_FILE, 'utf-8');
  const ids = JSON.parse(data);
  verifiedUsers = new Set(ids);
}

// 💾 Kullanıcı doğrulandıysa dosyaya yaz
function saveVerifiedUsers() {
  fs.writeFileSync(VERIFIED_USERS_FILE, JSON.stringify([...verifiedUsers]), 'utf-8');
}

// ✅ /start komutu ile matematik doğrulaması
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  if (verifiedUsers.has(chatId)) {
    return bot.sendMessage(chatId, `✅ Zaten doğrulandın.\n🆔 *Senin Telegram ID’n:* \`${chatId}\`\n🎮 Bu ID’yi oyuna girerken "User ID" alanına yapıştır.\n🔗 https://athype.online/`, { parse_mode: 'Markdown' });
  }

  const a = Math.floor(Math.random() * 10 + 1);
  const b = Math.floor(Math.random() * 10 + 1);
  const answer = a + b;

  bot.sendMessage(chatId, `🤖 Güvenlik doğrulaması: ${a} + ${b} = ?`);

  bot.once('message', (answerMsg) => {
    if (parseInt(answerMsg.text) === answer) {
      verifiedUsers.add(chatId);
      saveVerifiedUsers();
      bot.sendMessage(chatId, `✅ Doğrulama başarılı!\n🆔 *Senin Telegram ID’n:* \`${chatId}\`\n🎮 Bu ID’yi oyuna girerken "User ID" alanına yapıştır.\n🔗 https://athype.online/`, { parse_mode: 'Markdown' });
    } else {
      bot.sendMessage(chatId, "❌ Yanlış cevap. Lütfen tekrar /start yaz.");
    }
  });
});

// ✅ Unity'den gelen transfer isteğini işleyelim
app.post('/transfer', async (req, res) => {
  const { wallet, score, secret, userId } = req.body;

  if (secret !== SHARED_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!wallet || !score || !userId) {
    return res.status(400).json({ error: "Missing wallet, score or userId" });
  }

  if (!verifiedUsers.has(parseInt(userId))) {
    return res.status(403).json({ error: "User not verified via Telegram" });
  }

  try {
    const response = await axios.post(API_URL, { wallet, score }, {
      headers: { 'x-api-key': API_KEY }
    });

    return res.json({
      message: "✅ Transfer success",
      transactionHash: response.data.transactionHash
    });
  } catch (err) {
    console.error("❌ Transfer Error:", err?.response?.data || err.message);
    return res.status(500).json({ error: "Transfer failed" });
  }
});

// ✅ Basit health check
app.get('/', (req, res) => {
  res.send("🤖 Bot ve transfer sunucusu çalışıyor!");
});

app.listen(PORT, () => {
  console.log(`🚀 Sunucu ${PORT} portunda çalışıyor.`);
});
