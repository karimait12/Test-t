const { useSingleFileAuthState, makeWaSocket } = require("@adiwajshing/baileys");
const fs = require("fs");
const path = require("path");

// استخدم session/creds.json لحفظ بيانات الاتصال
const sessionPath = path.join(__dirname, "session/creds.json");
const { state, saveState } = useSingleFileAuthState(sessionPath);

async function startBot() {
    // إنشاء اتصال باستخدام Baileys
    const sock = makeWaSocket({
        auth: state,
        printQRInTerminal: true, // طباعة QR في الطرفية إذا لزم الأمر
    });

    // حفظ الجلسة تلقائيًا عند حدوث تغييرات
    sock.ev.on("creds.update", saveState);

    // الرد على الرسائل الواردة
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type === "notify") {
            const msg = messages[0];
            if (!msg.key.fromMe && msg.message) {
                const sender = msg.key.remoteJid;
                const text = msg.message.conversation;

                console.log(`رسالة من ${sender}: ${text}`);

                // إرسال رد
                await sock.sendMessage(sender, { text: "مرحبًا! تم ربط البوت بنجاح! ♥️" });
            }
        }
    });

    console.log("بوت واتساب يعمل الآن...");
}

startBot().catch((err) => {
    console.error("حدث خطأ أثناء تشغيل البوت:", err);
});
