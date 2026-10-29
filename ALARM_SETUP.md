# Webb-ALARM på husbil.org – personliga koder

**Mål:** Besökare trycker på ALARM, skriver sin egen kod och hör en bekräftelse på sidan.
Cloudflare Pages skickar koden över HTTPS till Node-RED med en separat servernyckel.
Node-RED identifierar personen och publicerar MQTT på `kamera/larm`, vilket triggar befintlig ESP32-S3-högtalare.

## Vad finns i GitHub?
- `index.html`: den nya ALARM-startsidan (ersätter gamla knappar).
- `functions/api/alarm.js`: Cloudflare Pages Function som vidarebefordrar koden till Node-RED och returnerar rätt fel-/svarskod.
- `node-red/kodkontroll-function.js`: kod som ska **ersätta innehållet** i Function-noden i ditt redan importerade Webb-ALARM-flöde.
- `node-red/webb-alarm.json`: referenskopia av hela flödet, inte avsett att importeras igen om det redan är installerat.

## Steg 1 – Ändra befintlig Function-nod i Node-RED
Öppna fliken `Webb-ALARM`, dubbelklicka på Function-noden (tidigare `Token + 30 s spärr`).
Kopiera hela innehållet i `node-red/kodkontroll-function.js` och ersätt Function-nodens befintliga kod.

Ändra sedan listan allra högst upp i Node-RED, till exempel:
```javascript
const personer = {
    "4821": "Person 1",
    "7359": "Person 2"
};
```
**Exempelvärdena ovan är inte aktiva i GitHub-filen** (där är de utkommenterade). Välj egna koder i Node-RED.
Koderna måste vara strängar inom citattecken; då fungerar även inledande nollor.
Skriv inte in riktiga personkoder i GitHub, skärmbilder eller chatt.

Spara Function-noden och tryck `Deploy`.
Behåll två utgångar och kablarna: utgång 1 → din redan fungerande MQTT Out, utgång 2 → HTTP Response.
Behåll miljövariabeln `ALARM_WEBHOOK_TOKEN` i Node-RED.

**VIKTIGT:** Ändra Function-noden och deploya den först, innan du testar den nya Cloudflare-versionen.
Annars kan den gamla Node-RED-koden acceptera en felaktig personkod, eftersom den bara kontrollerar servernyckeln.

## Steg 2 – Cloudflare Pages
För testadressen ska följande finnas under `Settings → Variables and Secrets → Preview`:
- `NODE_RED_URL`: `https://pajkitchen.husbil.org/alarm-webhook`
- `NODE_RED_TOKEN`: samma hemliga nyckel som `ALARM_WEBHOOK_TOKEN` i Node-RED.

`ALARM_CODE` behövs **inte längre**; Node-RED sköter all kodkontroll. Du kan låta den gamla variabeln finnas tills allt är testat eller ta bort den.
Gör en ny Preview-deployment av grenen `alarm-startsida`.
När allt fungerar och sidan ska publiceras behöver ovanstående två variabler också finnas i `Production`.

## Steg 3 – Test
1. Kör fel kod på Preview-sidan → meddelandet "Fel kod" och inget ljud.
2. Kör en kod som finns i Node-RED:s personlista → MQTT `kamera/larm` skickas och larmljudet hörs.
3. Klicka igen inom 30 sekunder → svar 429 ("Vänta 30 sekunder").
4. Funktion-noden visar namn och tid i sin status under noden. Historiken (högst 20 poster) finns i `flow` context under namnet `alarmHistorik`. För att överleva omstart krävs en persistent Context Store i Node-RED.
5. HTTP-svar 202 betyder att Node-RED accepterat kommandot, **inte** att högtalaren kvitterat fysisk uppspelning.

## Säkerhet
En separat, lång `NODE_RED_TOKEN` krävs även om besökaren har sin personliga fyrsiffriga kod.
Själva koderna ligger bara i din Node-RED-editor och delas med dem du väljer.
Sätt gärna en enkel begränsning av felaktiga försök i Cloudflare/WAF om sidan exponeras brett.
Exponera inte MQTT-brokern eller Node-RED:s redigeringsgränssnitt utan separat skydd.

**Denna testgren har inte publicerats på `main` och ändrar inte din körande Node-RED automatiskt.**
