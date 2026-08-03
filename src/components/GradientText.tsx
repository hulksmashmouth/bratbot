import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, TextStyle } from 'react-native';
import { accentGradient } from '../theme';

export function GradientText({ children, style }: { children: string; style?: TextStyle }) {
  return (
    <MaskedView maskElement={<Text style={style}>{children}</Text>}>
      <LinearGradient colors={accentGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}
