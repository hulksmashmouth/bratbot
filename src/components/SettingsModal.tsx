import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { listModels, OllamaError } from '../api/ollama';
import { checkRagHealth } from '../api/rag';

interface Props {
  visible: boolean;
  baseUrl: string;
  model: string;
  ragUrl: string;
  ragEnabled: boolean;
  onSave: (baseUrl: string, model: string, ragUrl: string, ragEnabled: boolean) => void;
  onClose: () => void;
}

type CheckStatus = 'idle' | 'checking' | 'ok' | 'error';

export function SettingsModal({
  visible,
  baseUrl,
  model,
  ragUrl,
  ragEnabled,
  onSave,
  onClose,
}: Props) {
  const [urlInput, setUrlInput] = useState(baseUrl);
  const [modelInput, setModelInput] = useState(model);
  const [ragUrlInput, setRagUrlInput] = useState(ragUrl);
  const [ragEnabledInput, setRagEnabledInput] = useState(ragEnabled);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [status, setStatus] = useState<CheckStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [ragStatus, setRagStatus] = useState<CheckStatus>('idle');
  const [ragChunkCount, setRagChunkCount] = useState<number | null>(null);
  const [ragError, setRagError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setUrlInput(baseUrl);
      setModelInput(model);
      setRagUrlInput(ragUrl);
      setRagEnabledInput(ragEnabled);
      setStatus('idle');
      setError(null);
      setRagStatus('idle');
      setRagError(null);
    }
  }, [visible, baseUrl, model, ragUrl, ragEnabled]);

  const testConnection = async () => {
    setStatus('checking');
    setError(null);
    try {
      const models = await listModels(urlInput.trim());
      setAvailableModels(models);
      setStatus('ok');
    } catch (err) {
      setStatus('error');
      setError(err instanceof OllamaError ? err.message : 'Could not connect.');
    }
  };

  const testRagConnection = async () => {
    setRagStatus('checking');
    setRagError(null);
    try {
      const { chunks } = await checkRagHealth(ragUrlInput.trim());
      setRagChunkCount(chunks);
      setRagStatus('ok');
    } catch (err) {
      setRagStatus('error');
      setRagError(err instanceof Error ? err.message : 'Could not connect.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Settings</Text>

          <Text style={styles.label}>Ollama server URL</Text>
          <TextInput
            style={styles.input}
            value={urlInput}
            onChangeText={setUrlInput}
            placeholder="http://192.168.1.x:11434"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <Text style={styles.label}>Model</Text>
          <TextInput
            style={styles.input}
            value={modelInput}
            onChangeText={setModelInput}
            placeholder="llama3.2"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Pressable style={styles.testButton} onPress={testConnection}>
            {status === 'checking' ? (
              <ActivityIndicator color="#007AFF" />
            ) : (
              <Text style={styles.testButtonText}>Test connection</Text>
            )}
          </Pressable>

          {status === 'ok' && (
            <Text style={styles.success}>
              Connected. Models: {availableModels.join(', ') || 'none installed'}
            </Text>
          )}
          {status === 'error' && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <Text style={styles.label}>Use imported chat history</Text>
            <Switch value={ragEnabledInput} onValueChange={setRagEnabledInput} />
          </View>

          <Text style={styles.label}>RAG server URL</Text>
          <TextInput
            style={styles.input}
            value={ragUrlInput}
            onChangeText={setRagUrlInput}
            placeholder="http://192.168.1.x:11435"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            editable={ragEnabledInput}
          />

          <Pressable
            style={styles.testButton}
            onPress={testRagConnection}
            disabled={!ragEnabledInput}
          >
            {ragStatus === 'checking' ? (
              <ActivityIndicator color="#007AFF" />
            ) : (
              <Text style={[styles.testButtonText, !ragEnabledInput && styles.testButtonTextDisabled]}>
                Check history index
              </Text>
            )}
          </Pressable>

          {ragStatus === 'ok' && (
            <Text style={styles.success}>
              {ragChunkCount === 0
                ? 'Connected, but no history imported yet.'
                : `Connected. ${ragChunkCount} chunks indexed.`}
            </Text>
          )}
          {ragStatus === 'error' && <Text style={styles.errorText}>{ragError}</Text>}
        </ScrollView>

        <View style={styles.actions}>
          <Pressable style={styles.actionButton} onPress={onClose}>
            <Text style={styles.actionButtonText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.saveButton]}
            onPress={() =>
              onSave(urlInput.trim(), modelInput.trim(), ragUrlInput.trim(), ragEnabledInput)
            }
          >
            <Text style={[styles.actionButtonText, styles.saveButtonText]}>Save</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    color: '#6b6b70',
    marginBottom: 6,
    marginTop: 16,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#f2f2f7',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  testButton: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 10,
  },
  testButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  testButtonTextDisabled: {
    color: '#b3d4fc',
  },
  success: {
    color: '#34a853',
    textAlign: 'center',
    marginTop: 4,
  },
  errorText: {
    color: '#d93025',
    textAlign: 'center',
    marginTop: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#d1d1d6',
    marginTop: 24,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    paddingTop: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f2f2f7',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  saveButtonText: {
    color: '#fff',
  },
});
