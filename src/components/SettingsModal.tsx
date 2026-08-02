import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { listModels, OllamaError } from '../api/ollama';

interface Props {
  visible: boolean;
  baseUrl: string;
  model: string;
  onSave: (baseUrl: string, model: string) => void;
  onClose: () => void;
}

export function SettingsModal({ visible, baseUrl, model, onSave, onClose }: Props) {
  const [urlInput, setUrlInput] = useState(baseUrl);
  const [modelInput, setModelInput] = useState(model);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setUrlInput(baseUrl);
      setModelInput(model);
      setStatus('idle');
      setError(null);
    }
  }, [visible, baseUrl, model]);

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

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
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

        <View style={styles.actions}>
          <Pressable style={styles.actionButton} onPress={onClose}>
            <Text style={styles.actionButtonText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.saveButton]}
            onPress={() => onSave(urlInput.trim(), modelInput.trim())}
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
  actions: {
    flexDirection: 'row',
    marginTop: 'auto',
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
