const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const pino = require('pino');

async function startBot() {
    // Railway dia mitahiry ny dossier 'session_wa' raha voa-configure tsara
    const { state, saveCreds } = await useMultiFileAuthState('session_wa');
    const { version } = await fetchLatestBaileysVersion();
    
    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    if (!sock.authState.creds.registered) {
        const phoneNumber = process.env.PHONE; // Ho fenoina ao amin'ny Railway
        if (!phoneNumber) {
            console.error("TSY MISY PHONE NUMBER! Ampidiro ao amin'ny Railway Variables.");
            return;
        }

        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                console.log(`\n\x1b[1;32m==============================\n=> PAIRING CODE-NAO: ${code}\n==============================\x1b[0m\n`);
            } catch (err) {
                console.error("Tsy nahazo pairing code. Jereo ny version na ny IP.");
            }
        }, 10000); // 10 segondra mba ho azo antoka ny fifandraisana
    }

    sock.ev.on('creds.update', saveCreds);

    // --- MIARAHABA MEMBRE VAOVAO ---
    sock.ev.on('group-participants.update', async (update) => {
        if (update.action === 'add') {
            for (let num of update.participants) {
                const welcomeMsg = `Salama 👋 Tongasoa! Jereo ny torolalana eto: https://milavolamada.lovable.app?ref=ravelomanantsoa-Rako`;
                await sock.sendMessage(update.id, { text: welcomeMsg });
            }
        }
    });

    // --- MODERATION SY FAMALIANA ---
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe || !msg.key.remoteJid.endsWith('@g.us')) return;

        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase();
        const sender = msg.key.participant;
        const groupId = msg.key.remoteJid;

        const hasLink = text.includes("http://") || text.includes("https://") || text.includes("www.");
        const isAllowedDomain = text.includes("milavolamada.lovable.app");

        if (hasLink && !isAllowedDomain) {
            try {
                await sock.sendMessage(groupId, { delete: msg.key });
                await sock.groupParticipantsUpdate(groupId, [sender], "remove");
            } catch (e) { console.log("Admin error"); }
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('BOT EFA VELONA AO AMIN\'NY RAILWAY!');
        }
    });
}

startBot();
