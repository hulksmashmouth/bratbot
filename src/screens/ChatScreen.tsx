import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { streamChat, OllamaError } from '../api/ollama';
import { ChatInput } from '../components/ChatInput';
import { MessageBubble } from '../components/MessageBubble';
import { SettingsModal } from '../components/SettingsModal';
import * as settings from '../settings';
import { ChatMessage } from '../types';

let nextId = 0;
const newId = () => `${Date.now()}-${nextId++}`;

export function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const loadSettings = useCallback(async () => {
    setBaseUrl(await settings.getBaseUrl());
    setModel(await settings.getModel());
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSend = async (text: string) => {
    setError(null);
    const userMessage: ChatMessage = { id: newId(), role: 'user', content: text };
    const assistantMessage: ChatMessage = { id: newId(), role: 'assistant', content: '' };
    const nextMessages = [...messages, userMessage];
    setMessages([...nextMessages, assistantMessage]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamChat(
        baseUrl,
        model,
        nextMessages,
        (delta) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id ? { ...m, content: m.content + delta } : m
            )
          );
        },
        controller.signal
      );
    } catch (err) {
      setError(err instanceof OllamaError ? err.message : 'Something went wrong.');
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleSaveSettings = async (newBaseUrl: string, newModel: string) => {
    await settings.setBaseUrl(newBaseUrl);
    await settings.setModel(newModel);
    setBaseUrl(newBaseUrl);
    setModel(newModel);
    setSettingsVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>bratbot</Text>
        <Pressable onPress={() => setSettingsVisible(true)} hitSlop={12}>
          <Text style={styles.settingsLink}>Settings</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Say hello to {model || 'your model'} running on {baseUrl || 'Ollama'}.
            </Text>
          }
        />
        {error && <Text style={styles.errorBanner}>{error}</Text>}
        <ChatInput disabled={isStreaming} onSend={handleSend} />
      </KeyboardAvoidingView>

      <SettingsModal
        visible={settingsVisible}
        baseUrl={baseUrl}
        model={model}
        onSave={handleSaveSettings}
        onClose={() => setSettingsVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#d1d1d6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  settingsLink: {
    color: '#007AFF',
    fontSize: 16,
  },
  listContent: {
    paddingVertical: 12,
    flexGrow: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: '#8e8e93',
    marginTop: 40,
    paddingHorizontal: 32,
  },
  errorBanner: {
    color: '#d93025',
    textAlign: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
});
