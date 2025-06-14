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
          web_app: { url: "https://bnbstrike.com" }
        }
      ]]
    }
  });
});

// TEST SKOR KOMUTU
bot.onText(/\/testscore/, async (msg) => {
  const chatId = msg.chat.id;

  // 1. "Bekleniyor..." mesajını gönder
  const statusMsg = await bot.sendMessage(chatId, "⏳ Bekleniyor: Ödeme hazırlanıyor...");

  const fake = {
    wallet: "0x20015618896635a24385a898E2d4626702991CBC",
    score: 100000000000
  };

  try {
    const response = await axios.post(process.env.API_URL, fake, {
      headers: { 'x-api-key': process.env.API_KEY }
    });

    // 2. "Bekleniyor" mesajını sil
    await bot.deleteMessage(chatId, statusMsg.message_id);

    // 3. Başarılı sonucu bildir
    await bot.sendMessage(chatId, `✅ Test token gönderildi!\n🔗 TxHash: ${response.data.transactionHash}`);
  } catch (err) {
    console.error(err);

    // 4. "Bekleniyor" mesajını sil
    await bot.deleteMessage(chatId, statusMsg.message_id);

    // 5. Hata mesajı gönder
    await bot.sendMessage(chatId, "❌ Test token gönderimi başarısız!");
  }
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
