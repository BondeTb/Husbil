// Webb-ALARM: personliga koder hanteras här i Node-RED, inte på hemsidan.
// ÄNDRA DEN HÄR LISTAN i Function-noden efter att du klistrat in koden.
// Koder måste vara inom citattecken (även om de bara består av siffror).
const personer = {
    // "4821": "Person 1",
    // "7359": "Person 2"
};

// Separat servernyckel mellan Cloudflare och Node-RED, redan konfigurerad.
const headers = msg.req?.headers || {};
const token = headers["x-alarm-token"];
const serverNyckel = env.get("ALARM_WEBHOOK_TOKEN");

function svar(status, data) {
    return {
        req: msg.req,
        res: msg.res,
        statusCode: status,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store"
        },
        payload: JSON.stringify(data)
    };
}

if (typeof serverNyckel !== "string" || serverNyckel.length < 24) {
    node.status({ fill: "red", shape: "ring", text: "Servernyckel saknas" });
    return [null, svar(503, { ok: false })];
}
if (typeof token !== "string" || token !== serverNyckel) {
    return [null, svar(403, { ok: false })];
}

let data = msg.payload;
if (typeof data === "string") {
    try { data = JSON.parse(data); } catch { data = null; }
}

const kod = typeof data?.code === "string" ? data.code.trim() : "";
if (!kod || !Object.prototype.hasOwnProperty.call(personer, kod)) {
    return [null, svar(401, { ok: false })];
}

const namn = personer[kod];
if (typeof namn !== "string" || !namn.trim()) {
    return [null, svar(401, { ok: false })];
}

// Max ett godkänt larm var 30:e sekund, oavsett person.
const nu = Date.now();
const senaste = context.get("lastAlarmAt") || 0;
if (nu - senaste < 30000) {
    return [null, svar(429, { ok: false, error: "Vänta 30 sekunder" })];
}
context.set("lastAlarmAt", nu);

// Spara vem som senast larmade. De 20 senaste finns i flow context.
const tid = new Date().toLocaleString("sv-SE", { timeZone: "Europe/Stockholm" });
const historik = flow.get("alarmHistorik") || [];
historik.unshift({ namn, tid });
flow.set("alarmHistorik", historik.slice(0, 20));

node.status({
    fill: "green",
    shape: "dot",
    text: namn + " larmade " + tid
});
node.log("Webb-ALARM från " + namn + " kl. " + tid);

// OBS: status 202 kvitterar att Node-RED har skickat MQTT-meddelandet
// till MQTT-out-noden, inte att högtalaren har bekräftat uppspelning.
return [
    { topic: "kamera/larm", payload: "1", qos: 0, retain: false },
    svar(202, { ok: true, person: namn })
];
