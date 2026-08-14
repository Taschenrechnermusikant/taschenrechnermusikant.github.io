# Tanzaff Productions

A single-page site for the Tanzaff Productions music project. Plain HTML, CSS and one small
JavaScript file. No build step, no framework, no dependencies.

## Preview locally

Open `index.html` in a browser, or run a tiny local server:

```bash
python -m http.server 8000
```

Then visit http://localhost:8000

## Files

| File | What it does |
| --- | --- |
| `index.html` | All the content: hero, Featured, All tracks, Collaborations, Listen, footer |
| `styles.css` | All the styling. Colors are variables at the top |
| `player.js` | Opens a track in a player on the page instead of sending the visitor to YouTube |

## Page structure

- **Featured**: three large cards for the tracks worth leading with.
- **All tracks**: the full Tanzaff catalogue, newest first, one row per track.
- **Collaborations**: tracks posted on someone else's channel (the Regata Collective ones).
- **Listen**, footer.

## Adding or changing a track

Copy an existing `<a class="track-link">` block in the **All tracks** list and change four things:

1. `href` and `data-video`: the YouTube video ID (the part after `watch?v=`).
2. `data-title` and the `<span class="track-title">`: the track name.
3. The thumbnail `src`: `https://i.ytimg.com/vi/<VIDEO_ID>/hqdefault.jpg`
4. The year and duration in `<span class="track-meta">`.

Rows are ordered newest first. Nothing is generated, so the list is exactly what is in the file.

Small grey tags next to a title (`feat. …`, `Fragment`, `NSFW`, `version 1`) are
`<span class="feat">` elements. Add or drop them freely.

If a track should also appear in **Featured**, copy an existing `<a class="feature-link">` block
as well. The same video can appear in both places.

### Thumbnails and the crop values

Thumbnails are hotlinked from YouTube, so no images are stored in the repo.

YouTube always returns a 4:3 image, and it pads anything that is not 16:9 with bars baked into
the picture. The cards would show those bars, so each image carries up to three values that push
them back out of the frame:

```html
<img src="https://i.ytimg.com/vi/FuIAWa-Lnl0/hqdefault.jpg" alt="" style="--zoom:1.44;--tx:-2.1%" />
```

- `--zoom` scales the picture up until the bars fall outside the card.
- `--tx` and `--ty` shift it sideways and up or down first. They are only needed when the padding
  is lopsided (a wide bar on one side and none on the other). Recentring first means less `--zoom`
  is needed, so less of the picture is thrown away. Most images need neither.

Rule of thumb when adding a track: load `https://i.ytimg.com/vi/<VIDEO_ID>/hqdefault.jpg`
directly in a browser and look at it.

- Bars on the left and right, evenly: start at `--zoom:1.35` and nudge until they are gone.
- One bar much wider than the other: add `--tx`, negative to move the picture left, positive to
  move it right, then find the smallest `--zoom` that clears both sides.
- No bars, picture fills the frame: leave the `style` attribute off entirely.

One warning. **The bars are not always black.** If the video carries a colour effect that was
applied after the letterboxing, the bars carry it too: Tanzschuel's are dark green, OK Boomer's
are dark green, and they are easy to miss at a glance. Judge by whether the strip is flat and
featureless, not by whether it is black.

The values already in the file were measured per image against the real edge of the picture, so
do not "tidy" them into one number.

## Changing colors or layout

Everything visual is in `styles.css`. The palette is defined as variables at the very top
(`--bg`, `--bg-card`, `--ink`, `--muted`, `--rule`, `--accent`, `--accent-2`, `--max`); change
them there and the whole site re-tones.

## After editing styles.css or player.js

Browsers cache those two files. `index.html` links them with a version number:

```html
<link rel="stylesheet" href="styles.css?v=9" />
<script src="player.js?v=9" defer></script>
```

Bump both numbers after editing either file, otherwise a reload may still show the old version.

## The player

Every track is a real link to YouTube, so the site still works with JavaScript switched off.
When JavaScript is on, `player.js` catches the click and opens the video in a panel on the page.
Nothing is loaded from YouTube until someone presses play, and the player uses
`youtube-nocookie.com`. Escape or a click outside closes it and stops playback.

Ctrl-click, middle-click and "open in new tab" are left alone and go to YouTube as normal.
