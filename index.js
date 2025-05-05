// index.js
const express = require('express');
const { makeWASocket, useMultiFileAuthState } = require('baileys');
const path = require('path');
const { unlinkSync } = require('fs');

const AUTH_DIR = path.join(__dirname, 'auth_info');
let sock;

// 1. Initialize WhatsApp connection
async function initWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false, // Disable QR in production
  });

  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    console.log('WA connection:', connection);
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
      if (shouldReconnect) initWhatsApp();
      else unlinkSync(path.join(AUTH_DIR, 'creds.json')); // Clear credentials if not reconnecting
    }
    if (connection === 'open') console.log('✅ WhatsApp connected');
  });
}

initWhatsApp().catch(console.error);

const app = express();
app.use(express.json());

// 2. POST /code endpoint to generate group invite code
app.post('/code', async (req, res) => {
  try {
    const { number, id } = req.body;

    // Optional: Verify the logged-in number matches the provided number
    const me = sock.user?.id.split(':')[0]; // e.g., "2127xxxxxxxx"
    if (number !== me) {
      return res.status(403).json({ error: 'Unauthorized number' });
    }

    // Generate invite code for the provided group ID
    const code = await sock.groupInviteCode(id);
    res.json({ code });
  } catch (err) {
    console.error('Error generating invite code:', err);
    res.status(500).json({ error: 'Could not fetch invite code' });
  }
});

// 3. Serve static files (e.g., HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
