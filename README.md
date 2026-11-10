# Trumpet Fingerings

A small installable web app (PWA) for B♭ trumpet. Tap a line or space on the staff and the
Fingering Display shows the three-valve fingering. The Accidentals Panel switches the note
between flat, natural and sharp. Written pitch, treble clef, no sound.

## Files

| File | What it does |
| --- | --- |
| `index.html` | Page structure |
| `style.css` | Look and layout |
| `app.js` | Staff drawing, note selection, **the fingering table** |
| `sw.js` | Service worker (offline support) |
| `manifest.webmanifest` | Makes the app installable |
| `icons/` | App icons |

## Changing a fingering

Open `app.js` and edit the `FINGERINGS` table at the top. Keys are MIDI numbers of the written
pitch (middle C = 60); values are the valves pressed (`[]` = open, `[1, 2]` = valves 1 + 2).

## After you change any file

Bump `CACHE_VERSION` in `sw.js` (for example `v1` to `v2`), otherwise installed copies keep
showing the old files.

## Hosting on GitHub Pages

1. Push all files to a repo, keeping the `icons/` folder.
2. Settings, then Pages, then deploy from the `main` branch (root).
3. Open the `https://<you>.github.io/<repo>/` link. Installing needs HTTPS, which Pages gives you.
