const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    DisconnectReason,
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const { Boom } = require("@hapi/boom");

const warnCount = {};

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion();
    
    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        },
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: ["Ubuntu", "Chrome", "20.0.04"],
    });

    // PAIRING CODE LOGIC (Laharana: 261382266876)
    if (!sock.authState.creds.registered) {
        const phoneNumber = "261382266876"; 
        console.log("Miandry 10 segondra alohan'ny hamoahana ny Pairing Code...");
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                console.log("\n-----------------------------");
                console.log("NY PAIRING CODE-NAO DIA:", code);
                console.log("-----------------------------\n");
            } catch (err) {
                console.log("Tsy afaka nampitambatra tamin'izao. Miandrasa kely (Rate Limit).");
            }
        }, 10000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const jid = msg.key.remoteJid;
        const isGroup = jid.endsWith('@g.us');
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const sender = msg.key.participant || jid;

        // --- HAFATRA FAMPANDRENESANA VAOVAO (Tsy misy kintana) ---
        const announcement = `FAMPANDRENESANA LEHIBE - NEXUS MADA

1. Noho ny olana nisy teo amin'ny compte NEXUS teo aloha dia nanapa-kevitra izahay namindra ny NEXUS amin'ny serveur hafa. Noho izany nisy zavatra niova tao, toy ny: base de données, stockage sns...

2. Noho ny fiovan'ireo base de données ireo dia voafafa ny mombamomba antsika teo aloha ka tsy afaka miditra amin'izany intsony ianao.

3. Fa amin'izao dia mila mamerina manao inscription indray ianao amin'ity lien d'inscription ity ihany fa tsy amin'ny taloha iny intsony:
https://nexusmada.vercel.app?ref=be-ge116

4. Zava-misy mety hiverina zero ny compte-nao, fa aza mataotra fa omena bonus daholo ianareo rehetra.

5. Ho an'ny mpandefa asa dia mandefa message privé aty aminay mba ahafahana mampiditra indray ilay depot anao ao amin'ny NEXUS, ary ahafahanao mamerina mandefa ilay asa indray ao izany.

TUTORIAL SY TARIDALANA:
- Guide Installation App: https:https://drive.google.com/file/d/1BKlyhVPtcGbiZsTaIEIfkiJDmJPApVvX/view?usp=drivesdk
- Guide Boost Page sy Referal: https://drive.google.com/file/d/1pWUYqOGXduqJYTdjeQcaGuzqPNMxb9FB/view?usp=drivesdk
- Guide Tâche (Asa): https://www.facebook.com/reel/1840991679907358/

Admin: 0382266876`;

        if (isGroup) {
            // Hamaly automatique rehefa misy miteny ".nexus" na ".start"
            if (text.toLowerCase() === '.nexus' || text.toLowerCase() === '.start') {
                await sock.sendMessage(jid, { 
                    text: announcement, 
                    mentions: [sender] 
                }, { quoted: msg });
            }

            // --- ANTI-LINK (Fafana izay mandefa lien hafa) ---
            const linkRegex = /https?:\/\/[^\s]+/;
            if (linkRegex.test(text)) {
                // Ireo lien ekena (Vercel, Lovable, Google Drive)
                const isSafe = text.includes('vercel.app') || text.includes('lovable.app') || text.includes('drive.google.com');
                
                if (!isSafe) {
                    try {
                        await sock.sendMessage(jid, { delete: msg.key });
                    } catch (e) {
                        console.log("Mila atao Admin ny bot mba hahafahany mamafa lien.");
                    }

                    if (!warnCount[sender]) {
                        warnCount[sender] = 1;
                        await sock.sendMessage(jid, { 
                            text: `⚠️ @${sender.split('@')[0]}, voarara ny mandefa rohy hafa ankoatra ny Vercel, Lovable, na Google Drive ato! Fampitandremana farany io.`,
                            mentions: [sender]
                        });
                    } else {
                        try {
                            await sock.sendMessage(jid, { text: `🚫 @${sender.split('@')[0]} nampitandremana nefa mbola mamerina, esorina ato amin'ny groupe.`, mentions: [sender] });
                            await delay(1000);
                            await sock.groupParticipantsUpdate(jid, [sender], "remove");
                            delete warnCount[sender];
                        } catch (e) {
                            console.log("Tsy afaka nandroaka olona.");
                        }
                    }
                }
            }
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ Tafiditra soa aman-tsara ny Bot NEXUS!');
        }
    });
}

startBot();
