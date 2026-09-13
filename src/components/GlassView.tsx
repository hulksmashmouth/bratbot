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
      <BlurView
        intensity={intensity}
        tint="light"
        style={[StyleSheet.absoluteFill, styles.behind]}
        pointerEvents="none"
      />
      <View style={[StyleSheet.absoluteFill, styles.tint, styles.behind]} pointerEvents="none" />
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
  behind: {
    zIndex: -1,
  },
});
