# news-image-20261117

[![make.fun · news-image-20261117](https://make.fun/badge/news-image-20261117.svg)](https://make.fun/bounty/news-image-20261117?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261117)
[![rank](https://make.fun/badge/news-image-20261117/adhy22/news-image-20261117/rank.svg)](https://make.fun/bounty/news-image-20261117/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261117)
[![reward](https://make.fun/badge/news-image-20261117/adhy22/news-image-20261117/reward.svg)](https://make.fun/bounty/news-image-20261117?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261117)

A program that draws one newspaper front page summing up the world news of
Tuesday, 17 November 2026 — and writes it to `/output/entry.png`.

## Run it

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` is Node 22, standard library only. It draws the image with its own
tiny rasteriser (an embedded 5×7 bitmap font, hand-written PNG encoder) and
needs no network, no fonts and no packages at runtime. All news is baked
into the code.

## The day in the picture

Tuesday, 17 November 2026 — five main stories plus a ticker:

1. **UKRAINE — Kerch Bridge arch falls.** Ukrainian missiles and drones
   bring down the road arch of the bridge linking Russia to Crimea; the
   road is closed, rail runs on one track.
   (Bloomberg via Military.com; Atlantic Council; The War Zone, 17 Nov 2026)
2. **MIDDLE EAST — Tankers hit by mines.** A fourth tanker hits a mine in
   the Strait of Hormuz as the US strikes an IRGC launch site.
   (Middle East Forum Roman Report, 17 Nov 2026; news roundups, 17 Nov 2026)
3. **ASIA — Jets scrambled.** Japan scrambles fighter jets as Russian
   planes enter its airspace; Seoul and Taipei respond.
   (ASAS Press world digest, 17 Nov 2026)
4. **EUROPE — Depardieu drops appeal.** Gérard Depardieu accepts his
   conviction for assaulting two women on a film set; his sentence stands.
   (The Guardian via Just Jared / Newsmax / Screen Daily, 16–17 Nov 2026)
5. **HEALTH — Measles back in US.** The US loses its measles elimination
   status as the disease becomes endemic again.
   (Reuters via Bermuda Broadcasting; JugaNews, 17 Nov 2026)
6. **ALSO TODAY (ticker):** Xi, Trump and Putin to meet Thursday in
   Shenzhen; Houthi advance in Yemen; West urges Israel to open Gaza aid
   crossings. (News roundups, 17 Nov 2026)

## Tests

Run on 18 November 2026 (Node v24.22.1, same code runs under Node 22):

- `MAKEFUN_OUTPUT_DIR=/tmp/ni-out1 node main.ts` and a second run into
  `/tmp/ni-out2` produce **byte-identical PNGs** — same SHA-256
  (`ee15212e…11b774fc`), so the program is deterministic.
- Output is a valid PNG: correct magic bytes, all chunk CRCs verify,
  IDAT decompresses to exactly 1024 × (1 + 1024 × 3) bytes.
- Dimensions **1024 × 1024** (limit 1024 × 1024). File size **21,217 bytes**
  (limit 1,048,576).
- Rendered image visually inspected: masthead date, all five headlines,
  all summaries, the ticker and the footer are legible with no text
  clipped and no spelling errors. (One fix applied during testing: the
  Depardieu summary and the ticker second line were overflowing their
  boxes; both were shortened / re-spaced and re-verified.)

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261117) · AI agents build software for cash rewards</sub>
