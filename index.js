const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const pino = require('pino');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session_wa');
    const { version } = await fetchLatestBaileysVersion();
    
    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // Ny nomeraonao mivantana
    const phoneNumber = "261382266876"; 

    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                console.log(`\n\x1b[1;32m==============================\n=> PAIRING CODE-NAO: ${code}\n==============================\x1b[0m\n`);
            } catch (err) {
                console.error("Tsy nahazo pairing code.");
            }
        }, 10000);
    }

    sock.ev.on('creds.update', saveCreds);

    // --- 1. FIARAHABANA SY TOROLALANA NEXUS ---
    sock.ev.on('group-participants.update', async (update) => {
        if (update.action === 'add') {
            for (let num of update.participants) {
                const welcomeMsg = `Salama 👋 Tongasoa ato amin'ny vondrona!
                
📢 *FILAZANA OFISIALY – NEXUS*

📥 *1. LIEN FAKANA APPLICATION NEXUS*
👉 https://drive.google.com/file/d/1BKlyhVPtcGbiZsTaIEIfkiJDmJPApVvX/view?usp=drivesdk

🚀 *2. LIEN FANAOVANA BOOST*
👉 https://drive.google.com/file/d/1s4OFJEcYgfvLk4THBqLdQQpzT637EF6P/view?usp=drivesdk

💼 *3. FANAOVANA TÂCHE (TOROLÀLANA)*
👉 https://drive.google.com/file/d/17L0dbEYMf4LNKopjdGqKjVcVAe8EG1wb/view?usp=drivesdk

✨ Araho tsara ireo torolàlana rehetra ao amin’ireo lien ireo. 
💙 *NEXUS dia eto hanampy anao hahomby!*`;

                await sock.sendMessage(update.id, { text: welcomeMsg });
            }
        }
    });

    // --- 2. MODERATION MAHERY VAIKA (Anti-Link) ---
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe || !msg.key.remoteJid.endsWith('@g.us')) return;

        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase();
        const sender = msg.key.participant || msg.key.remoteJid;
        const groupId = msg.key.remoteJid;

        // Fepetra: raha misy rohy nefa TSY misy an'ireo rohy NEXUS ireo
        const hasLink = text.includes("http://") || text.includes("https://") || text.includes("www.");
        const isNexusLink = text.includes("drive.google.com") || text.includes("milavolamada.lovable.app");

        if (hasLink && !isNexusLink) {
            try {
                // 1. Fafana ilay hafatra
                await sock.sendMessage(groupId, { delete: msg.key });
                
                // 2. Esosina miala ilay olona
                await sock.groupParticipantsUpdate(groupId, [sender], "remove");
                
                console.log(`Olona 1 nesorina tao amin'ny ${groupId} satria nandefa rohy.`);
            } catch (e) { 
                console.log("Admin error: Mety tsy Admin ny Bot na nisy olana."); 
            }
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('BOT NEXUS EFA VELONA!');
        }
    });
}

startBot();

