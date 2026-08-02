#!/usr/bin/env node
// Turns a ChatGPT data export (conversations.json) into embedded chunks that
// server/rag-server.mjs can search. Run this once after every new export.
//
// Usage: node scripts/import-chatgpt-export.mjs <path-to-conversations.json>

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';
const EMBED_MODEL = process.env.EMBED_MODEL ?? 'nomic-embed-text';
const OUTPUT_PATH = path.join(__dirname, '..', 'server', 'data', 'embeddings.json');
const CHUNK_CHAR_LIMIT = 2000;
const EMBED_BATCH_SIZE = 16;

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node scripts/import-chatgpt-export.mjs <path-to-conversations.json>');
  process.exit(1);
}

// ChatGPT exports store each conversation as a tree of edits/regenerations;
// walking parent pointers from current_node gives the branch that's actually
// shown in the UI, in reverse order.
function flattenConversation(conversation) {
  const messages = [];
  let nodeId = conversation.current_node;
  while (nodeId) {
    const node = conversation.mapping[nodeId];
    const message = node?.message;
    const role = message?.author?.role;
    const isVisibleText =
      message?.content?.content_type === 'text' && (!message.recipient || message.recipient === 'all');
    if (isVisibleText && (role === 'user' || role === 'assistant')) {
      const text = message.content.parts.join('\n').trim();
      if (text) messages.unshift({ role, text });
    }
    nodeId = node?.parent;
  }
  return messages;
}

function chunkConversation(title, createTime, messages) {
  const chunks = [];
  let buffer = [];
  let bufferLen = 0;

  const flush = () => {
    if (buffer.length === 0) return;
    const text = buffer.map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');
    chunks.push({ title, createTime, text });
    buffer = [];
    bufferLen = 0;
  };

  for (const message of messages) {
    if (bufferLen + message.text.length > CHUNK_CHAR_LIMIT && buffer.length > 0) flush();
    buffer.push(message);
    bufferLen += message.text.length;
  }
  flush();
  return chunks;
}

async function embedBatch(texts) {
  const res = await fetch(`${OLLAMA_URL}/api/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, input: texts }),
  });
  if (!res.ok) {
    throw new Error(
      `Ollama embed request failed (status ${res.status}): ${await res.text()}\n` +
        `Did you run "ollama pull ${EMBED_MODEL}"?`
    );
  }
  const data = await res.json();
  return data.embeddings;
}

async function main() {
  console.log(`Reading ${inputPath}...`);
  const conversations = JSON.parse(readFileSync(inputPath, 'utf8'));
  console.log(`Found ${conversations.length} conversations.`);

  const allChunks = [];
  for (const conversation of conversations) {
    const messages = flattenConversation(conversation);
    if (messages.length === 0) continue;
    const createTime = conversation.create_time
      ? new Date(conversation.create_time * 1000).toISOString().slice(0, 10)
      : '';
    allChunks.push(...chunkConversation(conversation.title ?? 'Untitled', createTime, messages));
  }
  console.log(`Built ${allChunks.length} chunks. Embedding via "${EMBED_MODEL}" at ${OLLAMA_URL}...`);

  const results = [];
  for (let i = 0; i < allChunks.length; i += EMBED_BATCH_SIZE) {
    const batch = allChunks.slice(i, i + EMBED_BATCH_SIZE);
    const embeddings = await embedBatch(batch.map((c) => c.text));
    batch.forEach((chunk, j) => {
      results.push({ id: `${i + j}`, ...chunk, embedding: embeddings[j] });
    });
    process.stdout.write(`\rEmbedded ${Math.min(i + EMBED_BATCH_SIZE, allChunks.length)}/${allChunks.length}`);
  }
  console.log();

  mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(results));
  console.log(`Wrote ${results.length} embedded chunks to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
