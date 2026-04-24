# Licitații Publice România

Interfață alternativă pentru e-licitatie.ro — mai rapidă, mai ușor de navigat.

---

## Pornire rapidă — StackBlitz (zero instalare, în browser)

1. Mergi la https://stackblitz.com/fork/nextjs
2. Șterge tot ce e în proiectul nou creat
3. Copiază fișierele din acest folder în același loc
4. StackBlitz rulează automat `npm install` + `npm run dev`
5. Apasă butonul **"Date live"** din interfață

---

## Pornire locală — Windows / Mac / Linux

### Cerințe
- Node.js 18+ → https://nodejs.org
- Un terminal (PowerShell pe Windows, Terminal pe Mac/Linux)

### Pași

```bash
# Clonează sau dezarhivează proiectul, apoi:
cd licitatii-ro
npm install
npm run dev
```

Deschide http://localhost:3000 în browser.

---

## Structura proiectului

```
licitatii-ro/
├── app/
│   ├── layout.js              ← Layout global (HTML, body)
│   ├── page.js                ← UI principal (tot frontend-ul)
│   └── api/
│       └── licitatii/
│           └── route.js       ← Proxy API (rezolvă CORS)
├── package.json
└── next.config.js
```

### De ce proxy?

Browserul blochează cereri directe către e-licitatie.ro (CORS).
`/api/licitatii` este un endpoint Next.js care face cererea dinspre server
(nu din browser), ocolind această restricție.

---

## Pașii următori

- [ ] Pas 2: Bază de date PostgreSQL (Neon) — salvăm datele local
- [ ] Pas 3: Sync automat zilnic (GitHub Actions cron)
- [ ] Pas 4: Căutare full-text avansată
- [ ] Pas 5: Deploy pe Vercel (site public gratuit)
