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

    const myNumber = "261382266876"; 

    // Pairing code raha mbola tsy registered
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

    // --- 1. FIARAHABANA ---
    sock.ev.on('group-participants.update', async (update) => {
        if (update.action === 'add') {
            for (let num of update.participants) {
                const welcomeMsg = `Salama 👋 Tongasoa!
                
📢 *FILAZANA OFISIALY – NEXUS*

📥 *1. LIEN APPLICATION:* https://drive.google.com/file/d/1BKlyhVPtcGbiZsTaIEIfkiJDmJPApVvX/view?usp=drivesdk
🚀 *2. LIEN BOOST:* https://drive.google.com/file/d/1s4OFJEcYgfvLk4THBqLdQQpzT637EF6P/view?usp=drivesdk
💼 *3. TOROLÀLANA TÂCHE:* https://drive.google.com/file/d/17L0dbEYMf4LNKopjdGqKjVcVAe8EG1wb/view?usp=drivesdk`;

                await sock.sendMessage(update.id, { text: welcomeMsg });
            }
        }
    });

    // --- 2. MODERATION ANTI-LINK ---
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe || !msg.key.remoteJid.endsWith('@g.us')) return;

        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.groupInviteMessage?.caption || "").toLowerCase();
        const groupId = msg.key.remoteJid;
        
        // Fantarina ny mpandefa (Sender)
        const sender = msg.key.participant || msg.key.remoteJid;
        const senderNumber = sender.split('@')[0];

        // Jereo raha misy rohy
        const hasLink = /(https?:\/\/[^\s]+|www\.[^\s]+)/g.test(text);
        
        // Ireo rohy mahazo alalana (Nexus sy Drive)
        const isAllowed = text.includes("drive.google.com") || text.includes("milavolamada.lovable.app");

        // RAHA MISY ROHY NEFA TSY AVY AMINAO SY TSY ROHY NEXUS
        if (hasLink && !isAllowed && senderNumber !== myNumber) {
            console.log(`Rohy voatsikaritra avy amin'i: ${senderNumber}`);
            
            try {
                // Fafana aloha ilay message
                await sock.sendMessage(groupId, { delete: msg.key });

                // Esosina ilay olona
                await sock.groupParticipantsUpdate(groupId, [sender], "remove");
                
                // Hafatra fampitandremana (Optionnel)
                await sock.sendMessage(groupId, { text: `⚠️ Nesorina i @${senderNumber} satria nandefa rohy tsy mahazo alalana.`, mentions: [sender] });

            } catch (e) {
                console.log("Tsy afaka mamafa olona: Hamarino raha ADMIN ny BOT.");
            }
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('BOT NEXUS MANDREHA...');
        }
    });
}

startBot();
