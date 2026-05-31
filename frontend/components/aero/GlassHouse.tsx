import { View, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLG, Stop, Polygon, Rect } from 'react-native-svg';

export default function GlassHouse() {
  return (
    <View style={styles.wrap}>
      <Svg width={84} height={74} viewBox="0 0 84 74">
        <Defs>
          <SvgLG id="body" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
            <Stop offset="1" stopColor="#aae1ff" stopOpacity="0.3" />
          </SvgLG>
          <SvgLG id="door" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#7fe6bf" />
            <Stop offset="1" stopColor="#37b98c" />
          </SvgLG>
        </Defs>
        <Polygon points="42,4 10,30 74,30" fill="#ffffff" fillOpacity={0.6} />
        <Rect x="18" y="30" width="48" height="38" rx="6" fill="url(#body)" stroke="#c8f2ff" strokeWidth="1" />
        <Rect x="36" y="50" width="12" height="18" rx="3" fill="url(#door)" />
        <Rect x="50" y="38" width="10" height="10" rx="2" fill="#ffffff" fillOpacity={0.75} />
      </Svg>
      <View style={styles.reflect} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  reflect: {
    width: 70,
    height: 12,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginTop: 2,
    transform: [{ scaleX: 1.15 }],
  },
});
