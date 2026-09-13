import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, Text, TextStyle } from 'react-native';
import { accentGradient } from '../theme';

export function GradientText({ children, style }: { children: string; style?: TextStyle }) {
  if (Platform.OS === 'web') {
    // @react-native-masked-view has no real web implementation (it just renders
    // the mask element with no masking applied), so use a CSS gradient-clip
    // instead of MaskedView on web.
    return (
      <Text
        style={[
          style,
          {
            backgroundImage: `linear-gradient(90deg, ${accentGradient.join(', ')})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          } as TextStyle,
        ]}
      >
        {children}
      </Text>
    );
  }

  return (
    <MaskedView maskElement={<Text style={style}>{children}</Text>}>
      <LinearGradient colors={accentGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}
