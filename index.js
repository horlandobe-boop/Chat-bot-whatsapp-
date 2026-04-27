const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    DisconnectReason,
    makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");
const pino = require("pino");

// Itahirizana ny isan'ny warning isaky ny mpampiasa
const warnCount = {};

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
    });

    // Pairing Code logic ho an'ny finday
    if (!sock.authState.creds.registered) {
        const phoneNumber = "261323911654"; 
        setTimeout(async () => {
            let code = await sock.requestPairingCode(phoneNumber);
            console.log("\n-----------------------------");
            console.log("KODIA PAIRING-NAO:", code);
            console.log("-----------------------------\n");
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const jid = msg.key.remoteJid;
        const isGroup = jid.endsWith('@g.us');
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const sender = msg.key.participant || jid;

        // --- VALINY MANAJA SY MIHAJA (Reply auto) ---
        const announcement = `Manao veloma finaritra ho anao @${sender.split('@')[0]},

Mankasitraka anao amin'ny fandraisana anjara ato amin'ny vondrona. Fantatray fa mety misy fahasahiranana kely mianjady aminao eo am-pampiasana ny tranonkala amin'izao fotoana izao, koa manatona anao izahay hanome fanazavana:

🔹 Fivoarana eo am-panatanterahana: Eo am-panatsarana sy fampitomboana ny herin'ny rafitra (Upgrade) izahay amin'izao fotoana izao mba hanomezana tolotra haingana sy mahomby kokoa ho anao.

✅ Fiantohana: Manome toky anao izahay fa voatahiry an-tsakany sy an-davany ny angon-drakitrao (données) rehetra fa tsy hisy ho very.

📞 Fifandraisana: Raha misy fanontaniana mavesatra aminao na mila fanazavana manokana ianao, dia aza misalasala miantso ny: 0382266876

Misaotra anao amin'ny faharetana sy ny fitokisana omenao ny NEXUS MICROTACHE.`;

        if (isGroup) {
            // Mamaly ny hafatra rehetra (Reply)
            await sock.sendMessage(jid, { 
                text: announcement, 
                mentions: [sender] 
            }, { quoted: msg });

            // --- DETECTION NY ROHY (Anti-Link) ---
            const linkRegex = /https?:\/\/[^\s]+/;
            
            if (linkRegex.test(text) && !text.includes('lovable.app')) {
                
                // 1. Fafana avy hatrany ilay hafatra
                await sock.sendMessage(jid, { delete: msg.key });

                // 2. Tantanan'ny Warning
                if (!warnCount[sender]) {
                    warnCount[sender] = 1;
                    await sock.sendMessage(jid, { 
                        text: `⚠️ @${sender.split('@')[0]}, voarara ny mandefa rohy hafa ankoatra ny lovable.app ato! Fampitandremana farany io, raha mamerina ianao dia hoesorina.`,
                        mentions: [sender]
                    });
                } else {
                    // Kick amin'ny fanindroany
                    await sock.sendMessage(jid, { text: `🚫 @${sender.split('@')[0]} nampitandremana nefa mbola mamerina, voatery esorina ato amin'ny groupe.`, mentions: [sender] });
                    await delay(1000);
                    await sock.groupParticipantsUpdate(jid, [sender], "remove");
                    delete warnCount[sender];
                }
            }
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        }
    });
}

startBot();
