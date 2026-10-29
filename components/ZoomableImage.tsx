import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";


export default function ZoomableImage({ uri }: { uri: string }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      const nextScale = savedScale.value * event.scale;
      scale.value = Math.max(1, Math.min(nextScale, 4));
    })
    .onEnd(() => {
      savedScale.value = scale.value;

      if (scale.value <= 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;

        translateX.value = withSpring(0);
        translateY.value = withSpring(0);

        savedX.value = 0;
        savedY.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .maxPointers(1)
    .onUpdate((event) => {
      if (scale.value > 1) {
        translateX.value = savedX.value + event.translationX;
        translateY.value = savedY.value + event.translationY;
      }
    })
    .onEnd(() => {
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;

        translateX.value = withSpring(0);
        translateY.value = withSpring(0);

        savedX.value = 0;
        savedY.value = 0;
      } else {
        scale.value = withSpring(2);
        savedScale.value = 2;
      }
    });

  const gesture = Gesture.Race(
    doubleTap,
    Gesture.Simultaneous(pinch, pan)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <View style={{ flex: 1, overflow: "hidden" }}>
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[
            {
              width: "100%",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
            },
            animatedStyle,
          ]}
        >
          <Animated.Image
            source={{ uri }}
            resizeMode="contain"
            style={{
              width: "100%",
              height: "100%",
            }}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
