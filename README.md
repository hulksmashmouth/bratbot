# bratbot

An iOS-first React Native (Expo) chat client for [Ollama](https://ollama.com), running locally on your Mac.

## Stack

- Expo (managed workflow) + TypeScript
- No navigation library — single chat screen with a Settings sheet
- `@react-native-async-storage/async-storage` for persisting server URL / model
- Streaming responses via `XMLHttpRequest` (React Native's `fetch` doesn't expose a readable `response.body`, so streaming NDJSON from Ollama's `/api/chat` uses XHR `onprogress`, the standard RN workaround)

## 1. Make Ollama reachable from your phone

By default `ollama serve` only listens on `127.0.0.1`, so an iPhone on the same
Wi-Fi can't reach it. Expose it on your LAN:

```sh
# If you run the Ollama.app menu-bar app on macOS:
launchctl setenv OLLAMA_HOST 0.0.0.0
# then quit and reopen the Ollama app

# If you run it from the CLI instead:
OLLAMA_HOST=0.0.0.0 ollama serve
```

Pull a model if you haven't already:

```sh
ollama pull llama3.2
```

Make sure your Mac's firewall allows incoming connections on port 11434, and
that your phone and Mac are on the same Wi-Fi network.

## 2. Run the app

```sh
npm install
npx expo start
```

Scan the QR code with your iPhone's Camera app — it opens directly in
[Expo Go](https://apps.apple.com/app/expo-go/id982107779), live-reloading as
you edit. No Xcode or Simulator needed.

The app tries to guess your Mac's LAN IP from the Expo dev server automatically.
If it guesses wrong, or you're running on Expo Go on a physical device, open
**Settings** in the app and set the URL manually, e.g. `http://192.168.1.42:11434`,
then tap **Test connection**.

## Project layout

```
App.tsx                  entry point, wraps ChatScreen in SafeAreaProvider
src/
  types.ts               ChatMessage type
  settings.ts             AsyncStorage-backed server URL / model persistence
  api/ollama.ts           streamChat() + listModels() against Ollama's HTTP API
  components/
    MessageBubble.tsx
    ChatInput.tsx
    SettingsModal.tsx
  screens/
    ChatScreen.tsx         message list, streaming state, wiring
```

## Notes

- `app.json` sets `NSAllowsLocalNetworking` so iOS permits plain-HTTP requests
  to your local Ollama server (App Transport Security otherwise blocks
  non-HTTPS requests).
- Conversation history is in-memory only (cleared on reload). Persisting it
  is a natural next step once the core loop feels good.
