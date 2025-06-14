require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

// Kullanıcı doğrulama için basit whitelist (hafızada, gerçek projede DB olmalı)
const verifiedUsers = new Set();

// Telegram Bot başlat
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Sağlık kontrolü
app.get('/', (req, res) => {
  res.send('🤖 Bot çalışıyor!');
});

app.listen(port, () => {
  console.log(`🚀 Sunucu ${port} portunda çalışıyor`);
});

// Hata yakalama
bot.on('polling_error', (error) => {
  console.error('📡 Polling error:', error);
});

bot.on('error', (error) => {
  console.error('❗ General error:', error);
});

// /start komutu: oyun linki gönderir
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "🎮 Oyuna başlamak için aşağıdaki butona tıklayın:", {
    reply_markup: {
      inline_keyboard: [[
        {
          text: "🔪 Crypto Ninja'yı Oyna",
          web_app: { url: "https://athype.online/" }  // Oyunun WebApp URL'si
        }
      ]]
    }
  });
});

// /verify komutu: kullanıcıyı doğrula ve whitelist'e ekle
bot.onText(/\/verify/, (msg) => {
  const chatId = msg.chat.id;
  if (verifiedUsers.has(chatId)) {
    bot.sendMessage(chatId, "✅ Zaten doğrulandınız!");
  } else {
    verifiedUsers.add(chatId);
    bot.sendMessage(chatId, "✅ Başarıyla doğrulandınız! Artık oyunu oynayabilirsiniz.");
  }
});

// /status komutu: kullanıcı doğrulama durumu
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  if (verifiedUsers.has(chatId)) {
    bot.sendMessage(chatId, "✅ Doğrulandınız, oyun oynayabilirsiniz.");
  } else {
    bot.sendMessage(chatId, "⚠️ Henüz doğrulanmadınız. Doğrulamak için /verify yazın.");
  }
});

// /help komutu: yardım mesajı
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
📌 Komutlar:
/start - Oyuna başlamak için link
/verify - Doğrulama yapmak için
/status - Doğrulama durumunu gösterir
/help - Yardım mesajı
`;
  bot.sendMessage(chatId, helpMessage);
});

// Bot, mesajları ve doğrulamayı yönetiyor
// Unity backend API, skor kabul etmeden önce burada verifiedUsers setini kontrol etmeli
// Örnek olarak, Unity backend bu listeyi sorgulamak için bir endpoint isteyebilir
