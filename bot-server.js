require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, "🎮 Oyuna başlamak için aşağıdaki butona tıklayın:", {
    reply_markup: {
      inline_keyboard: [[
        {
          text: "🔪 Crypto Ninja'yı Oyna",
          web_app: { url: "https://senin-unity-oyun-webapp-linkin.vercel.app" }
        }
      ]]
    }
  });
});

// WebApp üzerinden skor verisi geldiğinde
bot.on('message', async (msg) => {
  if (!msg.web_app_data) return;

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

    bot.sendMessage(msg.chat.id, `✅ Skor: ${score}\n💸 Token gönderildi!\nİşlem Hash: ${response.data.transactionHash}`);
  } catch (error) {
    console.error(error);
    bot.sendMessage(msg.chat.id, "❌ Token gönderimi başarısız oldu!");
  }
});
