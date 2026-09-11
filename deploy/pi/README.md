# Running Dolly Pocket standalone on a Raspberry Pi 5

Everything — Ollama, the RAG server, and the chat UI itself — running on one
Pi, booting straight into a fullscreen kiosk. No phone, no Mac required.

Assumes: Pi 5 8GB, NVMe SSD via a bottom-mount HAT (e.g. Pimoroni NVMe Base),
Raspberry Pi OS Lite 64-bit, default `pi` user, repo cloned to
`/home/pi/dollypocket`. Adjust paths/usernames in the `.service` files if yours
differ.

## 1. Flash & boot

1. Flash Raspberry Pi OS **Lite** (64-bit) to a microSD card with Raspberry Pi
   Imager — you need this once to set the boot order to PCIe/NVMe, even if
   you never boot from the card again.
2. Boot once from the microSD, then:
   ```sh
   sudo raspi-config
   # Advanced Options → PCIe Speed → enable Gen 3
   # Advanced Options → Boot Order → NVMe/USB Boot
   sudo reboot
   ```
3. Flash the same OS image onto the NVMe drive (via `rpi-imager` targeting
   the NVMe device, or `rpi-clone` from the running SD card), then power off,
   remove the SD card, and boot from NVMe going forward.

## 2. Base packages

```sh
sudo apt update && sudo apt install -y nodejs npm cage seatd chromium-browser git
sudo usermod -aG seat,video,input,render pi
curl -fsSL https://ollama.com/install.sh | sh
```

## 3. Pull a model sized for your RAM

```sh
# 8GB Pi — comfortable:
ollama pull llama3.2:3b
# fallback if you're still on 2GB:
ollama pull qwen2.5:0.5b

# only needed if you're keeping RAG (chat history retrieval) enabled:
ollama pull nomic-embed-text
```

Update `DEFAULT_MODEL` in [`src/settings.ts`](../../src/settings.ts) to match
whichever you pulled, or just set it once from the app's Settings sheet after
first boot.

## 4. Get the app onto the Pi

```sh
cd /home/pi
git clone <your-repo-url> dollypocket
cd dollypocket
npm install
npx expo export --platform web
```

This produces `dist/`, a static build the Pi serves to itself — no Metro dev
server involved. Re-run the export any time you change the app and want to
update the kiosk.

## 5. Install the services

```sh
sudo cp deploy/pi/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now seatd dollypocket-web dollypocket-rag dollypocket-kiosk
```

- **dollypocket-web** — serves `dist/` on `:8080` (see
  [`server/static-server.mjs`](../../server/static-server.mjs))
- **dollypocket-rag** — chat-history retrieval on `:11435`, only useful if
  you've run `npm run import-chatgpt-history` (see main
  [README](../../README.md)); safe to `systemctl disable dollypocket-rag` if
  you're skipping RAG on this build
- **dollypocket-kiosk** — `cage` (minimal Wayland kiosk compositor) running
  Chromium fullscreen against `localhost:8080`

The app's `guessDefaultBaseUrl()`/`guessDefaultRagUrl()` already fall back to
`localhost` when there's no Expo dev-server manifest present (i.e. exactly
this production case), so no Settings changes are needed on first boot.

## 6. Sanity checks

```sh
systemctl status dollypocket-web dollypocket-rag dollypocket-kiosk ollama
journalctl -u dollypocket-kiosk -f   # if the screen stays black
curl localhost:8080              # should return the app's index.html
curl localhost:11434/api/tags    # should list your pulled model(s)
```

## Known rough edges

- **Thermal**: sealed cases with no vents will throttle under sustained
  inference load. Watch `vcgencmd measure_temp` under a chat session before
  you seal anything permanently.
- **cage/chromium black screen**: almost always `seatd` not running, or `pi`
  missing from the `seat`/`video`/`input` groups — check
  `journalctl -u dollypocket-kiosk` first.
- **DSI displays**: if you end up on a DSI panel instead of HDMI, you'll need
  the matching `dtoverlay` in `/boot/firmware/config.txt` — not covered here
  since the panel isn't picked yet.
