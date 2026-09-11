# Dolly Pocket

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

## 3. Optional: import your ChatGPT history (RAG)

Dolly Pocket can retrieve relevant snippets from your old ChatGPT conversations and
feed them to Ollama as context before answering, so the model can reference
things you've talked about before. This runs entirely on your Mac — the phone
only ever talks to Ollama and a small local search server.

**Export your ChatGPT data:** ChatGPT Settings → Data controls → Export data.
You'll get an email with a zip; unzip it and find `conversations.json`.

**Pull an embedding model:**

```sh
ollama pull nomic-embed-text
```

**Build the index** (re-run this after every new export; it embeds every
message via Ollama, so it takes a while for a large history):

```sh
npm run import-chatgpt-history -- ~/Downloads/chatgpt-export/conversations.json
```

This writes `server/data/embeddings.json` — your personal chat history in
embedded form. It's git-ignored and never leaves your Mac.

**Run the search server**, alongside `ollama serve`:

```sh
npm run rag-server
```

It listens on port 11435 and needs the same firewall exception Ollama did:

```sh
which node   # find node's path
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add "$(which node)"
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp "$(which node)"
```

In the app's **Settings**, the RAG server URL is guessed the same way as the
Ollama URL (same host, port 11435). Toggle **Use imported chat history** on
and tap **Check history index** to confirm it found your chunks. From then on,
relevant past excerpts are silently retrieved and injected as context on every
message — they don't show up as visible chat bubbles.

## Project layout

```
App.tsx                  entry point, wraps ChatScreen in SafeAreaProvider
src/
  types.ts               ChatMessage type
  settings.ts             AsyncStorage-backed server URL / model / RAG persistence
  api/ollama.ts           streamChat() + listModels() against Ollama's HTTP API
  api/rag.ts               searchHistory() + checkRagHealth() against the RAG server
  components/
    MessageBubble.tsx
    ChatInput.tsx
    SettingsModal.tsx
  screens/
    ChatScreen.tsx         message list, streaming state, RAG retrieval, wiring
server/
  rag-server.mjs           local HTTP server: embeds query via Ollama, cosine
                            similarity search over server/data/embeddings.json
  data/                    git-ignored — your embedded chat history lives here
scripts/
  import-chatgpt-export.mjs  one-time (per export) script: chunk + embed
                              conversations.json into server/data/embeddings.json
```

## Notes

- `app.json` sets `NSAllowsLocalNetworking` so iOS permits plain-HTTP requests
  to your local Ollama server (App Transport Security otherwise blocks
  non-HTTPS requests).
- Conversation history is in-memory only (cleared on reload). Persisting it
  is a natural next step once the core loop feels good.
