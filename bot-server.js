require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Kullanıcıların doğrulama durumlarını tutan nesne
// chatId => { verified: bool, question: string, answer: number }
const users = {};

// Rastgele basit toplama sorusu üret
function generateMathQuestion() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  return {
    question: `Doğrulama için cevaplayın: ${a} + ${b} = ?`,
    answer: a + b
  };
}

// /start komutu: sadece doğrulanmış kullanıcılar için
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  if (!users[chatId] || !users[chatId].verified) {
    bot.sendMessage(chatId, "⚠️ Öncelikle matematik sorusunu doğru cevaplayarak doğrulanmalısınız.");
    // Eğer henüz soru gönderilmemişse gönder
    if (!users[chatId]) {
      const mathQ = generateMathQuestion();
      users[chatId] = { verified: false, question: mathQ.question, answer: mathQ.answer };
      bot.sendMessage(chatId, mathQ.question);
    }
    return;
  }

  // Doğrulama tamam ise oyun linki verilir
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

// Gelen tüm mesajları kontrol et (cevap kontrolü dahil)
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Eğer kullanıcı doğrulanmışsa başka mesajları yoksayabiliriz
  if (users[chatId] && users[chatId].verified) return;

  // Eğer kullanıcıya soru gönderildiyse cevap kontrolü yap
  if (users[chatId] && users[chatId].question) {
    if (text === String(users[chatId].answer)) {
      users[chatId].verified = true;
      bot.sendMessage(chatId, "✅ Doğrulama başarılı! Artık /start komutunu kullanabilirsiniz.");
    } else {
      bot.sendMessage(chatId, "❌ Yanlış cevap, lütfen tekrar deneyin: " + users[chatId].question);
    }
  } else {
    // Kullanıcıdan ilk mesaj, doğrulama sorusunu gönder
    const mathQ = generateMathQuestion();
    users[chatId] = { verified: false, question: mathQ.question, answer: mathQ.answer };
    bot.sendMessage(chatId, "Merhaba! Oyunu oynamadan önce doğrulama gerekiyor.");
    bot.sendMessage(chatId, mathQ.question);
  }
});
