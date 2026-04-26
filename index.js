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

    // NOMERAONAO MANOKANA (Ilay Bot)
    const myNumber = "261382266876"; 

    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(myNumber);
                console.log(`\n=> PAIRING CODE: ${code}\n`);
            } catch (err) {
                console.error("Error request pairing code");
            }
        }, 10000);
    }

    sock.ev.on('creds.update', saveCreds);

    // --- 1. BIENVENUE & NEXUS INFO ---
    sock.ev.on('group-participants.update', async (update) => {
        if (update.action === 'add') {
            for (let num of update.participants) {
                const welcomeMsg = `Salama 👋 Tongasoa!
                
📢 *FILAZANA OFISIALY – NEXUS*

📥 *1. LIEN APPLICATION:* https://drive.google.com/file/d/1BKlyhVPtcGbiZsTaIEIfkiJDmJPApVvX/view?usp=drivesdk
🚀 *2. LIEN BOOST:* https://drive.google.com/file/d/1s4OFJEcYgfvLk4THBqLdQQpzT637EF6P/view?usp=drivesdk
💼 *3. TOROLÀLANA TÂCHE:* https://drive.google.com/file/d/17L0dbEYMf4LNKopjdGqKjVcVAe8EG1wb/view?usp=drivesdk

✨ Araho tsara ireo torolàlana rehetra ao amin’ireo lien ireo.`;

                await sock.sendMessage(update.id, { text: welcomeMsg });
            }
        }
    });

    // --- 2. MODERATION ANTI-LINK MAHERY VAIKA ---
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe || !msg.key.remoteJid.endsWith('@g.us')) return;

        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.groupInviteMessage?.caption || "").toLowerCase();
        const groupId = msg.key.remoteJid;
        
        // Hamantarana ny mpandefa
        const sender = msg.key.participant || msg.key.remoteJid;
        const senderNumber = sender.replace(/[^0-9]/g, ''); // Mitazona isa fotsiny

        // Detection ny Rohy (Link)
        const hasLink = /(https?:\/\/[^\s]+|www\.[^\s]+)/g.test(text);
        const isAllowed = text.includes("drive.google.com") || text.includes("milavolamada.lovable.app");

        // RAHA MISY ROHY:
        if (hasLink && !isAllowed) {
            // Hamarinina raha tsy ny tompony (Ianao) no nandefa azy
            if (senderNumber.includes(myNumber.substring(3))) {
                console.log("=> Rohy avy amin'ny tompony: Tsy fafana.");
                return;
            }

            console.log(`=> ROHY VOATSIKARITRA avy amin'i: ${senderNumber}`);
            
            try {
                // FAMAFAFA NY HAFATRA
                await sock.sendMessage(groupId, { delete: msg.key });
                console.log("=> Hafatra voafafa soa aman-tsara.");

                // FANALANA NY OLONA
                await sock.groupParticipantsUpdate(groupId, [sender], "remove");
                console.log("=> Olona nesorina tao amin'ny group.");
                
                await sock.sendMessage(groupId, { text: `⚠️ Nesorina ny mpikambana iray satria nandefa rohy tsy mahazo alalana.` });

            } catch (e) {
                console.log("=> ERROR MODERATION: Hamarino raha ADMIN ny Bot.");
                console.log(e.message);
            }
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ BOT NEXUS EFA MIASA ARY VONONA!');
        }
    });
}

startBot();
