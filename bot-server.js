require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Gizli anahtar (Unity ile aynı olmalı)
const SHARED_SECRET = process.env.SHARED_SECRET;

// API URL (Gerçek transfer backend’iniz)
const REAL_API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

app.use(bodyParser.json());

app.post('/transfer', async (req, res) => {
  const { wallet, score, secret } = req.body;

  if (secret !== SHARED_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!wallet || !score) {
    return res.status(400).json({ error: "Missing wallet or score" });
  }

  try {
    const response = await axios.post(REAL_API_URL, { wallet, score }, {
      headers: {
        'x-api-key': API_KEY
      }
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

app.listen(PORT, () => {
  console.log(`🚀 Ara sunucu ${PORT} portunda çalışıyor.`);
});
