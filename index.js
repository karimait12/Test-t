const { default: makeWASocket, useSingleFileAuthState } = require('baileys');
const fs = require('fs');

const { state, saveState } = useSingleFileAuthState('./auth_info.json');

async function startBot() {
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on('creds.update', saveState);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    const from = msg.key.remoteJid;
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
    if (text?.toLowerCase().includes('تطبيق')) {
      const filePath = './file-to-send.pdf';
      if (fs.existsSync(filePath)) {
        await sock.sendMessage(from, {
          document: { url: filePath },
          mimetype: 'application/pdf',
          fileName: 'تطبيق.pdf'
        });
      }
    }
  });

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close' && lastDisconnect.error?.output?.statusCode !== 401) {
      startBot();
    }
  });
}

startBot();
