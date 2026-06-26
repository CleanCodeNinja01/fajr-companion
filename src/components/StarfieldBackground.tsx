// Decorative background: scattered gold + blush star dots on dark bg
// Usage: place as first child of any screen container with position:relative
import React from 'react';
import { StyleSheet, View } from 'react-native';

// Hardcoded dot positions — (left%, top%, size, opacity, color)
// Generated to mimic the splash.png starfield pattern
const DOTS: [number, number, number, number, string][] = [
  [5,   3,  1.5, 0.55, '#E8A85F'],
  [18,  7,  1,   0.40, '#F5D6D3'],
  [33,  2,  2,   0.65, '#E8A85F'],
  [48,  5,  1,   0.35, '#F5D6D3'],
  [62,  1,  1.5, 0.50, '#E8A85F'],
  [78,  8,  2,   0.60, '#F5D6D3'],
  [90,  4,  1,   0.45, '#E8A85F'],
  [95,  12, 1.5, 0.55, '#F5D6D3'],
  [2,   15, 2,   0.50, '#E8A85F'],
  [14,  18, 1,   0.30, '#F5D6D3'],
  [26,  13, 1.5, 0.60, '#E8A85F'],
  [40,  19, 1,   0.40, '#F5D6D3'],
  [55,  11, 2,   0.55, '#E8A85F'],
  [68,  16, 1,   0.35, '#F5D6D3'],
  [82,  14, 1.5, 0.50, '#E8A85F'],
  [93,  20, 1,   0.45, '#F5D6D3'],
  [8,   26, 1.5, 0.40, '#E8A85F'],
  [22,  30, 2,   0.60, '#F5D6D3'],
  [37,  24, 1,   0.35, '#E8A85F'],
  [52,  28, 1.5, 0.55, '#F5D6D3'],
  [65,  23, 1,   0.30, '#E8A85F'],
  [77,  31, 2,   0.65, '#F5D6D3'],
  [88,  27, 1.5, 0.50, '#E8A85F'],
  [4,   38, 1,   0.35, '#F5D6D3'],
  [17,  42, 1.5, 0.55, '#E8A85F'],
  [29,  36, 2,   0.60, '#F5D6D3'],
  [44,  40, 1,   0.40, '#E8A85F'],
  [58,  35, 1.5, 0.50, '#F5D6D3'],
  [72,  43, 1,   0.35, '#E8A85F'],
  [85,  38, 2,   0.55, '#F5D6D3'],
  [96,  44, 1,   0.45, '#E8A85F'],
  [10,  50, 1.5, 0.40, '#F5D6D3'],
  [24,  54, 1,   0.30, '#E8A85F'],
  [38,  48, 2,   0.60, '#F5D6D3'],
  [53,  52, 1.5, 0.55, '#E8A85F'],
  [67,  47, 1,   0.35, '#F5D6D3'],
  [80,  55, 2,   0.65, '#E8A85F'],
  [92,  50, 1,   0.40, '#F5D6D3'],
  [6,   62, 1.5, 0.50, '#E8A85F'],
  [19,  66, 1,   0.30, '#F5D6D3'],
  [32,  60, 2,   0.55, '#E8A85F'],
  [46,  64, 1.5, 0.45, '#F5D6D3'],
  [60,  59, 1,   0.35, '#E8A85F'],
  [74,  67, 2,   0.60, '#F5D6D3'],
  [87,  63, 1,   0.40, '#E8A85F'],
  [98,  68, 1.5, 0.50, '#F5D6D3'],
  [3,   74, 1,   0.30, '#E8A85F'],
  [15,  78, 2,   0.55, '#F5D6D3'],
  [28,  72, 1.5, 0.45, '#E8A85F'],
  [42,  76, 1,   0.35, '#F5D6D3'],
  [56,  71, 2,   0.60, '#E8A85F'],
  [70,  79, 1,   0.40, '#F5D6D3'],
  [83,  75, 1.5, 0.50, '#E8A85F'],
  [94,  80, 1,   0.30, '#F5D6D3'],
  [9,   87, 2,   0.55, '#E8A85F'],
  [21,  84, 1,   0.35, '#F5D6D3'],
  [35,  89, 1.5, 0.45, '#E8A85F'],
  [49,  83, 1,   0.30, '#F5D6D3'],
  [63,  88, 2,   0.55, '#E8A85F'],
  [76,  85, 1,   0.40, '#F5D6D3'],
  [89,  90, 1.5, 0.50, '#E8A85F'],
  [97,  86, 1,   0.35, '#F5D6D3'],
  [12,  94, 2,   0.55, '#E8A85F'],
  [25,  97, 1,   0.30, '#F5D6D3'],
  [41,  93, 1.5, 0.45, '#E8A85F'],
  [57,  96, 1,   0.35, '#F5D6D3'],
  [71,  92, 2,   0.55, '#E8A85F'],
  [84,  95, 1,   0.30, '#F5D6D3'],
];

export default function StarfieldBackground() {
  return (
    <View style={styles.container} pointerEvents="none">
      {DOTS.map(([left, top, size, opacity, color], i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left:     `${left}%` as `${number}%`,
            top:      `${top}%`  as `${number}%`,
            width:    size,
            height:   size,
            borderRadius: size / 2,
            backgroundColor: color,
            opacity,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});
