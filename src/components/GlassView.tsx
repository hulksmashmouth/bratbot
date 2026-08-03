import { BlurView } from 'expo-blur';
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { colors } from '../theme';

interface Props extends ViewProps {
  intensity?: number;
  style?: StyleProp<ViewStyle>;
}

export function GlassView({ intensity = 40, style, children, ...rest }: Props) {
  return (
    <View style={[styles.container, style]} {...rest}>
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.tint]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  tint: {
    backgroundColor: colors.glassFill,
  },
});
