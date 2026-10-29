// Lägg denna Function-nod MELLAN
// "Personkod + token + 30 s spärr" (utgång 1)
// och MQTT out "ESP32-S3 ljudalarm".
//
// En inkommande larmsignal skickas totalt 10 gånger,
// med 5 sekunder mellan STARTERNA (0, 5, 10, ... 45 s).
// HTTP-svaret från den befintliga kodkontrollnodens
// utgång 2 går fortfarande direkt till HTTP Response.

const antal = 10;
const pausMs = 5000;

function skicka(nummer) {
    node.send({
        topic: msg.topic || "kamera/larm",
        payload: msg.payload ?? "1",
        qos: msg.qos ?? 0,
        retain: false
    });
    node.status({
        fill: "green",
        shape: "dot",
        text: "Larmsignal " + nummer + "/" + antal
    });
}

skicka(1);

for (let i = 1; i < antal; i++) {
    setTimeout(() => skicka(i + 1), i * pausMs);
}

return null;
