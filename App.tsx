import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ChatScreen } from './src/screens/ChatScreen';
import { bgGradient } from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <LinearGradient
        colors={bgGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        <ChatScreen />
      </LinearGradient>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
});
