# ALARM startsida för husbil.org

Denna gren ersätter **bara startsidans innehåll** med en stor ALARM-knapp.
Klick visar en kodruta. Rätt kod leder till ett serveranrop till Node-RED, som ska publicera MQTT `kamera/larm`.
Befintlig ESP32-S3-kod behöver inte ändras.

## Innan publicering

1. Kontrollera att Cloudflare Pages-projektet använder detta GitHub-repo och att Pages Functions stöds på byggkonfigurationen. Funktionen ligger i `functions/api/alarm.js`.
2. Cloudflare Dashboard → Workers & Pages → ditt Pages-projekt → Settings → Variables and Secrets.
   Lägg till tre **krypterade secrets** för produktionsmiljön:
   - `ALARM_CODE`: stark, unik kod som lämnas ut till utvalda personer (gärna minst 10 tecken, inte enkla sifferkoder).
   - `NODE_RED_URL`: fullständig HTTPS-URL till en dedikerad Node-RED HTTP In, t.ex. `https://DIN-NODERED-DOMAN/alarm-webhook`.
   - `NODE_RED_TOKEN`: lång slumpmässig hemlighet för webhooken, **inte** samma sak som `ALARM_CODE`.
   Lägg aldrig dessa värden i GitHub.
3. I Node-RED: `HTTP In` POST `/alarm-webhook` → kontrollera `msg.req.headers['x-alarm-token']` på servern → `MQTT out` `kamera/larm`; skicka `HTTP Response` 200 endast efter godkänd token och att MQTT-meddelandet har lämnats till MQTT-noden. För fel token svara 401/403 utan MQTT. Undvik att exponera Node-RED:s editor utan separat autentisering.
4. Sätt en Cloudflare WAF-rate-limitregel på `/api/alarm` (t.ex. max 5 försök per IP och minut) så ingen kan prova koder eller spamma larmet. Kontrollera även att webhooken inte går att anropa utan token.
5. Testa fel kod, rätt kod, oåtkomlig Node-RED och upprepade anrop, **innan** grenen slås ihop med `main`.

Koden meddelar bara att Node-RED har svarat OK, inte att högtalaren faktiskt spelat. För kvittens av fysisk uppspelning behövs separat MQTT-svar från ESP32-S3.

Denna gren ändrar ännu inte något i Cloudflare-inställningarna eller i Node-RED. Ingen hemlig kod är fördefinierad.
