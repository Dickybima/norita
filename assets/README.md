# Norita logo

A sprout whose stems form the letter **N**, growing out of a tilled field inside
a round wooden badge, with a morning sky and sun behind it.

- `logo.svg`: the logo (32×32 pixel art, scales without blur). Used in the site headers and as the favicon.
- `logo-512.png`: 512×512 PNG with a transparent background, for social profiles or a token icon.
- `apple-touch-icon.png`: 180×180 home-screen icon.
- `make_logo.py`: regenerates `logo.svg` (`python3 make_logo.py logo.svg`).

Show it with `image-rendering: pixelated` so the pixels stay sharp.

## Gameplay video

- `norita-gameplay.mp4`: 51-second gameplay video (H.264, 1280×720), recorded from the game.
- `norita-gameplay.jpg`: its cover image.
- `video-modal.js`: the pop-up player opened by the Video buttons.
- `record-gameplay.js`: the Playwright script that recorded the video.

## X (Twitter) images

In `social/`:

- `x-avatar.png`: profile picture, 400×400 (X shows it as a circle; the badge fits inside).
- `x-header.png`: header, 1500×500, spring morning. `x-header-fall.png` (autumn evening) and
  `x-header-night.png` (summer night) are alternatives.
- `header.html`, `avatar.html` and `render.js`: the sources and the script that renders them.
