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

const verifiedUsers = new Set();

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  if (verifiedUsers.has(chatId)) {
    return bot.sendMessage(chatId, "✅ Zaten doğrulama yapılmış. Oyuna aşağıdaki butondan ulaşabilirsin:", {
      reply_markup: {
        inline_keyboard: [[
          {
            text: "🎮 Oyunu Aç",
            web_app: { url: "https://athype.online/" }  // WebGL oyununun barındığı harici URL
          }
        ]]
      }
    });
  }

  const a = Math.floor(Math.random() * 10 + 1);
  const b = Math.floor(Math.random() * 10 + 1);
  const answer = a + b;

  bot.sendMessage(chatId, `🤖 Güvenlik doğrulaması: ${a} + ${b} = ?`);
  bot.once('message', (answerMsg) => {
    if (parseInt(answerMsg.text) === answer) {
      verifiedUsers.add(chatId);
      bot.sendMessage(chatId, "✅ Doğrulama başarılı! Oyuna aşağıdaki butondan ulaşabilirsin:", {
        reply_markup: {
          inline_keyboard: [[
            {
              text: "🎮 Oyunu Aç",
              web_app: { url: "https://athype.online/" }  // Harici oyunun URL'si
            }
          ]]
        }
      });
    } else {
      bot.sendMessage(chatId, "❌ Yanlış cevap. Lütfen tekrar /start yaz.");
    }
  });
});

app.post('/transfer', async (req, res) => {
  const { wallet, score, secret } = req.body;

  if (secret !== SHARED_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!wallet || !score) {
    return res.status(400).json({ error: "Missing wallet or score" });
  }

  try {
    const response = await axios.post(API_URL, { wallet, score }, {
      headers: { 'x-api-key': API_KEY }
    });

    res.json({
      message: "Transfer success",
      transactionHash: response.data.transactionHash
    });
  } catch (err) {
    console.error("🚨 Transfer Error:", err?.response?.data || err.message);
    res.status(500).json({ error: "Transfer failed" });
  }
});

app.get('/', (req, res) => {
  res.send("🤖 Bot ve transfer sunucusu çalışıyor!");
});

app.listen(PORT, () => {
  console.log(`🚀 Sunucu ${PORT} portunda çalışıyor.`);
});
