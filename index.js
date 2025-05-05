const { useSingleFileAuthState, default: makeWASocket } = require("@adiwajshing/baileys");
const fs = require("fs");
const path = require("path");

// استخدم session/creds.json لحفظ بيانات الاتصال
const sessionPath = path.join(__dirname, "auth_info/creds.json");
const { state, saveState } = useSingleFileAuthState(sessionPath);

async function startBot() {
    try {
        console.log("تم تشغيل البوت بنجاح! انتظر الرسائل...");

        // إنشاء اتصال باستخدام Baileys
        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: true, // طباعة QR في الطرفية إذا لزم الأمر
        });

        // حفظ الجلسة تلقائيًا عند حدوث تغييرات
        sock.ev.on("creds.update", saveState);

        // الرد على الرسائل الواردة
        sock.ev.on("messages.upsert", async ({ messages, type }) => {
            try {
                if (type === "notify") {
                    const msg = messages[0];
                    if (!msg.key.fromMe && msg.message) {
                        const sender = msg.key.remoteJid;
                        const text = msg.message.conversation || "";

                        console.log(`رسالة من ${sender}: ${text}`);

                        // إرسال رد
                        await sock.sendMessage(sender, { text: `شكراً على رسالتك: "${text}"! ♥️` });
                    }
                }
            } catch (err) {
                console.error("حدث خطأ أثناء معالجة الرسائل:", err.message, err.stack);
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
