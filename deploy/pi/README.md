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
sudo apt update && sudo apt install -y nodejs npm cage seatd chromium-browser git python3-venv
# Debian's seatd has no "seat" group (unlike Arch) — its seatd.service runs as
# `seatd -g video`, so `video` is what grants seat access here. See Troubleshooting.
sudo usermod -aG video,input,render pi
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

## 5. Optional: local text-to-speech (Piper)

Lets the app read replies aloud, fully offline — no cloud TTS. Skip this
section (and `dollypocket-tts` in the next step) if you don't want the
feature; it's off by default in the app's Settings either way.

```sh
cd /home/pi/dollypocket/server
python3 -m venv piper-venv
piper-venv/bin/pip install piper-tts
piper-venv/bin/python3 -m piper.download_voices en_US-amy-medium --data-dir voices
```

`en_US-amy-medium` is the warmest-sounding voice in Piper's stock catalog —
there's no genuinely Southern-accented option, so this is as close as local
TTS gets. Turn it on and point it at `http://localhost:11436` from the app's
Settings sheet once `dollypocket-tts` (below) is running.

## 6. Install the services

```sh
sudo cp deploy/pi/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now seatd dollypocket-web dollypocket-rag dollypocket-tts dollypocket-kiosk
```

- **dollypocket-web** — serves `dist/` on `:8080` (see
  [`server/static-server.mjs`](../../server/static-server.mjs))
- **dollypocket-rag** — chat-history retrieval on `:11435`, only useful if
  you've run `npm run import-chatgpt-history` (see main
  [README](../../README.md)); safe to `systemctl disable dollypocket-rag` if
  you're skipping RAG on this build
- **dollypocket-tts** — Piper text-to-speech on `:11436` (see step 5 above);
  safe to `systemctl disable dollypocket-tts` if you skipped that step
- **dollypocket-kiosk** — `cage` (minimal Wayland kiosk compositor) running
  Chromium fullscreen against `localhost:8080`

The app's `guessDefaultBaseUrl()`/`guessDefaultRagUrl()`/`guessDefaultTtsUrl()`
already fall back to `localhost` when there's no Expo dev-server manifest
present (i.e. exactly this production case), so no Settings changes are
needed on first boot beyond turning TTS on if you set it up.

## 7. Sanity checks

```sh
systemctl status dollypocket-web dollypocket-rag dollypocket-tts dollypocket-kiosk ollama
journalctl -u dollypocket-kiosk -f   # if the screen stays black
curl localhost:8080              # should return the app's index.html
curl localhost:11434/api/tags    # should list your pulled model(s)
curl localhost:11436/health      # should report the configured Piper voice
```

## Known rough edges

- **Thermal**: sealed cases with no vents will throttle under sustained
  inference load. Watch `vcgencmd measure_temp` under a chat session before
  you seal anything permanently.
- **cage/chromium black screen**: almost always `seatd` not running, or `pi`
  missing from the `video`/`input`/`render` groups (see Troubleshooting) —
  check `journalctl -u dollypocket-kiosk` first.
- **DSI displays**: if you end up on a DSI panel instead of HDMI, you'll need
  the matching `dtoverlay` in `/boot/firmware/config.txt` — not covered here
  since the panel isn't picked yet.

## Troubleshooting

- **No `seat` group on Debian**: Arch-based seatd setups add the user to a
  `seat` group, but Raspberry Pi OS's `seatd` package doesn't create one —
  its `seatd.service` runs as `seatd -g video`, so group membership is
  granted through `video` instead. Add `pi` to `video`, `input`, and
  `render` (step 2 above already does this); adding a nonexistent `seat`
  group will just fail/no-op rather than granting anything.

- **Testing from another device before a display arrives**: while setting up
  headless, you may want to hit the app from a browser on your phone or
  laptop instead of the Pi itself. `curl http://<pi-ip>:11434/api/tags` will
  work fine, but the same request from a browser gets blocked by CORS even
  though the server is reachable. Ollama needs to both bind to all
  interfaces *and* explicitly allow cross-origin requests:
  ```sh
  sudo systemctl edit ollama
  ```
  ```ini
  [Service]
  Environment="OLLAMA_HOST=0.0.0.0"
  Environment="OLLAMA_ORIGINS=*"
  ```
  ```sh
  sudo systemctl restart ollama
  ```
  This is only needed for that cross-device testing window — on the final
  kiosk setup, Chromium and Ollama both run on `localhost` on the same Pi,
  so neither variable is required there.

- **Waveshare 3.2" HDMI LCD (H) (480x800)**: this panel needs a custom
  `hdmi_timings` line in `/boot/firmware/config.txt`:
  ```
  hdmi_timings=480 0 50 20 50 800 0 19 20 20 0 0 0 60 0 38000000 6
  ```
  Also note the Pi 5 has no full-size HDMI port — you'll need a
  micro-HDMI-to-HDMI adapter to connect this panel.
