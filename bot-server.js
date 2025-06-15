require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const SHARED_SECRET = process.env.SHARED_SECRET;
const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// ✅ Doğrulanmış kullanıcıları burada tutuyoruz
const verifiedUsers = new Set();

// ✅ /start komutu: kullanıcıya ID’sini göster ve doğrulama sorusu sor
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  if (verifiedUsers.has(chatId)) {
    return bot.sendMessage(chatId, `✅ Zaten doğrulandın!\n🎮 Oyunu başlatmak için tıkla:`, {
      reply_markup: {
        inline_keyboard: [[
          {
            text: "🎮 Oyunu WebApp ile Başlat",
            web_app: { url: "https://athype.online/" }
          }
        ]]
      }
    });
  }

  // Telegram ID göster
  const a = Math.floor(Math.random() * 10 + 1);
  const b = Math.floor(Math.random() * 10 + 1);
  const answer = a + b;

  bot.sendMessage(chatId, `🆔 *Senin Telegram ID'n:* \`${chatId}\`\n\n⚠️ Devam etmek için soruyu yanıtla:\n*${a} + ${b} = ?*`, {
    parse_mode: 'Markdown'
  });

  // Cevabı bir kere dinle
  bot.once('message', (answerMsg) => {
    if (parseInt(answerMsg.text) === answer) {
      verifiedUsers.add(chatId);

      bot.sendMessage(chatId, `✅ Doğrulama başarılı!\n🎮 Oyunu başlatmak için aşağıdaki butona tıkla:`, {
        reply_markup: {
          inline_keyboard: [[
            {
              text: "🎮 Oyunu WebApp ile Başlat",
              web_app: { url: "https://athype.online/" }
            }
          ]]
        }
      });
    } else {
      bot.sendMessage(chatId, "❌ Yanlış cevap. Tekrar /start yaz.");
    }
  });
});

// ✅ Unity’den gelen skor + ID + cüzdan doğrulama ve transfer
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

// ✅ Sağlık kontrolü
app.get('/', (req, res) => {
  res.send("🤖 Bot ve transfer sunucusu aktif!");
});

app.listen(PORT, () => {
  console.log(`🚀 Sunucu ${PORT} portunda çalışıyor.`);
});
