require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

// BOT BAŞLAT
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// HEALTH CHECK
app.get('/', (req, res) => {
  res.send('🤖 Bot çalışıyor!');
});

app.listen(port, () => {
  console.log(`🚀 Sunucu ${port} portunda çalışıyor`);
});

// HATALARI YAKALA
bot.on('polling_error', (error) => {
  console.error('📡 Polling error:', error);
});

bot.on('error', (error) => {
  console.error('❗ General error:', error);
});

// /start KOMUTU
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, "🎮 Oyuna başlamak için aşağıdaki butona tıklayın:", {
    reply_markup: {
      inline_keyboard: [[
        {
          text: "🔪 Crypto Ninja'yı Oyna",
          web_app: { url: "https://athype.online/" }
        }
      ]]
    }
  });
});

// WEB APP VERİ YAKALAMA
bot.on('message', async (msg) => {
  // /start ve komut mesajlarını geç
  if (msg.text || !msg.web_app_data) return;

  let data;
  try {
    data = JSON.parse(msg.web_app_data.data);
  } catch {
    return bot.sendMessage(msg.chat.id, "⚠️ Geçersiz veri formatı!");
  }

  const { wallet, score } = data;

  if (!wallet || !score) {
    return bot.sendMessage(msg.chat.id, "⚠️ Cüzdan adresi veya skor eksik!");
  }

  try {
    const response = await axios.post(process.env.API_URL, { wallet, score }, {
      headers: { 'x-api-key': process.env.API_KEY }
    });

    bot.sendMessage(msg.chat.id, `✅ Skor: ${score}\n💸 Token gönderildi!\n🔗 TxHash: ${response.data.transactionHash}`);
  } catch (error) {
    console.error('❌ Token gönderimi hatası:', error?.response?.data || error.message);
    bot.sendMessage(msg.chat.id, "❌ Token gönderimi başarısız oldu!");
  }
});
