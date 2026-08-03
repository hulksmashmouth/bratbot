import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { ChatMessage } from '../types';
import { accentGradient, colors, radii } from '../theme';
import { GlassView } from './GlassView';

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      {isUser ? (
        <LinearGradient
          colors={accentGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bubble, styles.bubbleUser]}
        >
          <Text style={styles.textUser}>{message.content || '…'}</Text>
        </LinearGradient>
      ) : (
        <GlassView style={[styles.bubble, styles.bubbleAssistant]}>
          <Text style={styles.textAssistant}>{message.content || '…'}</Text>
        </GlassView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowAssistant: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    borderBottomLeftRadius: 4,
  },
  textUser: {
    color: '#fff',
    fontSize: 16,
  },
  textAssistant: {
    color: colors.textPrimary,
    fontSize: 16,
  },
});
