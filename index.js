const { useSingleFileAuthState, default: makeWASocket, DisconnectReason } = require("@adiwajshing/baileys");
const fs = require("fs");
const path = require("path");

// إعداد ملف الجلسة
const sessionPath = path.join(__dirname, "auth_info/creds.json");
const sessionDir = path.dirname(sessionPath);
if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
}
const { state, saveState } = useSingleFileAuthState(sessionPath);

async function startBot() {
    try {
        console.log("بدء تشغيل البوت...");

        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: true,
        });

        sock.ev.on("creds.update", saveState);

        sock.ev.on("connection.update", (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === "close") {
                const shouldReconnect =
                    lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log("تم فصل الاتصال. إعادة المحاولة:", shouldReconnect);
                if (shouldReconnect) startBot();
            } else if (connection === "open") {
                console.log("تم الاتصال بواتساب!");
            }
        });

        sock.ev.on("messages.upsert", async ({ messages, type }) => {
            try {
                if (type === "notify") {
                    const msg = messages[0];
                    if (!msg.key.fromMe && msg.message) {
                        const sender = msg.key.remoteJid;
                        const getMessageText = (message) =>
                            message.conversation || message.extendedTextMessage?.text || "";
                        const text = getMessageText(msg.message);

                        console.log(`رسالة من ${sender}: ${text}`);

                        if (text) {
                            await sock.sendMessage(sender, { text: `شكراً على رسالتك: "${text}"! ♥️` });
                        }
                    }
                }
            } catch (err) {
                console.error("حدث خطأ أثناء معالجة الرسائل:", err.message);
            }
        });

        console.log("بوت واتساب يعمل الآن...");
    } catch (err) {
        console.error("حدث خطأ أثناء تشغيل البوت:", err.message, err.stack);
    }
}

startBot().catch((err) => {
    console.error("حدث خطأ غير متوقع أثناء تشغيل البوت:", err.message, err.stack);
});
