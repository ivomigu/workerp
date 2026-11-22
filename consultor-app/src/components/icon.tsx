import { SymbolView } from 'expo-symbols';
import type { SymbolViewProps } from 'expo-symbols';
import type { ColorValue } from 'react-native';

type Props = {
  /** SF Symbol (iOS) y Material Symbol (Android). */
  name: SymbolViewProps['name'];
  size?: number;
  color: ColorValue;
};

export function Icon({ name, size = 20, color }: Props) {
  // En web se usan los mismos íconos Material que en Android.
  const nombre = typeof name === 'object' && !name.web ? { ...name, web: name.android } : name;
  return (
    <SymbolView
      name={nombre}
      tintColor={color}
      resizeMode="scaleAspectFit"
      style={{ width: size, height: size }}
    />
  );
}
