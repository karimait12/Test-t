const { default: makeWASocket, useMultiFileAuthState } = require('baileys');
const fs = require('fs');

async function startBot() {
  // Specify the session folder path
  const sessionFolder = './auth_info'; // The folder that will contain the session files

  // Check if the session folder exists
  if (!fs.existsSync(sessionFolder)) {
    console.error(`The folder ${sessionFolder} does not exist! Please create it.`);
    process.exit(1);  // Exit the process if folder is not found
  }

  // Use the useMultiFileAuthState function to handle authentication
  const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);

  // Create a socket connection to WhatsApp
  const sock = makeWASocket({
    auth: state,  // Using the authentication state
  });

  // Save credentials when they are updated
  sock.ev.on('creds.update', saveCreds);

  // Event listener for connection updates (for connection status)
  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      console.log('⚠️ Connection closed, attempting to reconnect...');
      startBot();  // Retry on connection close
    } else if (connection === 'open') {
      console.log('✅ Successfully connected!');
    }
  });

  // Event listener for incoming messages
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return; // Only process new notifications
    const msg = messages[0];
    const from = msg.key.remoteJid;
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

    // If the message contains the word "تطبيق" (Arabic for "application")
    if (text?.toLowerCase().includes('تطبيق')) {
      const filePath = './file-to-send.pdf';

      // Check if the file exists before sending
      if (fs.existsSync(filePath)) {
        // Send the file as a document
        await sock.sendMessage(from, {
          document: { url: filePath },  // Path to the file
          mimetype: 'application/pdf',  // MIME type of the file
          fileName: 'تطبيق.pdf',  // File name to be sent
        });
        console.log(`File sent to ${from}`);
      } else {
        console.log('File not found!');
      }
    }
  });
}

// Start the bot
startBot();
