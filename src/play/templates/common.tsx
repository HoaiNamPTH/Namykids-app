import { useRef } from "react";
import { Animated, Image, StyleSheet, Text, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from "react-native";
import type { Pic } from "../engine/types";
import { ITEMS } from "../items";
import { play } from "../theme";
import { playType } from "../../ui/typography";
import { foundationAssets } from "../../ui/foundation-assets";

/** Gentle side-to-side shake for a wrong answer. */
export function useWiggle() {
  const x = useRef(new Animated.Value(0)).current;
  const run = () => {
    x.setValue(0);
    Animated.sequence([
      Animated.timing(x, { toValue: -8, duration: 70, useNativeDriver: false }),
      Animated.timing(x, { toValue: 8, duration: 90, useNativeDriver: false }),
      Animated.timing(x, { toValue: -5, duration: 80, useNativeDriver: false }),
      Animated.timing(x, { toValue: 0, duration: 70, useNativeDriver: false }),
    ]).start();
  };
  return { style: { transform: [{ translateX: x }] }, run };
}

export function PicView({ pic, size }: { pic: Pic; size: number }) {
  if ("where" in pic) return <PlacedPic pic={pic} size={size} />;
  if ("item" in pic) {
    const s = pic.small ? size * 0.58 : size * 0.86;
    return <Image accessible={false} source={ITEMS[pic.item].image as ImageSourcePropType} resizeMode="contain" style={{ width: s, height: s, marginTop: pic.small ? size * 0.22 : 0 }} />;
  }
  const fontSize = size * (pic.glyph.length > 1 ? 0.42 : 0.62);
  return <Text style={[styles.glyph, { fontSize, lineHeight: fontSize * 1.25 }]}>{pic.glyph}</Text>;
}

const img = (pic: { item: keyof typeof ITEMS }) => ITEMS[pic.item].image as ImageSourcePropType;

/** Positions game: the big picture (`on`) with a small one on top of / under / inside / beside it. */
function PlacedPic({ pic, size }: { pic: Extract<Pic, { where: unknown }>; size: number }) {
  const big = size * 0.66;
  const small = size * (pic.where === "trong" ? 0.26 : 0.32);
  const bigTop = pic.where === "tren" ? size * 0.3 : pic.where === "duoi" ? size * 0.04 : size * 0.17;
  const bigLeft = pic.where === "canh" ? size * 0.04 : (size - big) / 2 - size * 0.04;
  const place: Record<typeof pic.where, { left: number; top: number }> = {
    tren: { left: (size - small) / 2 - size * 0.04, top: bigTop - small * 0.78 },
    duoi: { left: (size - small) / 2 - size * 0.04, top: bigTop + big - small * 0.62 },
    trong: { left: (size - small) / 2 - size * 0.04, top: bigTop + big * 0.5 },
    canh: { left: bigLeft + big - size * 0.02, top: bigTop + big - small },
  };
  const under = pic.where === "duoi";
  const bigImg = <Image key="big" accessible={false} source={ITEMS[pic.on].image as ImageSourcePropType} resizeMode="contain" style={{ position: "absolute", width: big, height: big, left: bigLeft, top: bigTop }} />;
  const smallImg = <Image key="small" accessible={false} source={img(pic)} resizeMode="contain" style={{ position: "absolute", width: small, height: small, ...place[pic.where] }} />;
  return <View style={{ width: size, height: size }}>{under ? [smallImg, bigImg] : [bigImg, smallImg]}</View>;
}

export type CardState = "idle" | "selected" | "ok" | "dim";

const FRAMES = [foundationAssets.tileGreen, foundationAssets.tilePurple, foundationAssets.tileRed];

export function CardFace({ pic, size, state = "idle", style }: { pic: Pic; size: number; state?: CardState; style?: StyleProp<ViewStyle> }) {
  // Letters sit in the approved Soft CGI letter tiles; the frame colour follows the letter.
  if ("glyph" in pic && !("item" in pic)) {
    const frame = FRAMES[((pic.glyph.charCodeAt(0) || 0) >> 2) % FRAMES.length];
    return <View style={[{ width: size, height: size, alignItems: "center", justifyContent: "center" }, state === "dim" && styles.dim, style]}>
      <Image accessible={false} source={frame as ImageSourcePropType} resizeMode="contain" style={{ position: "absolute", width: size, height: size }} />
      {state === "ok" || state === "selected" ? <View style={[styles.ring, { width: size * 0.9, height: size * 0.9, borderRadius: size * 0.2 }, state === "ok" ? styles.ringOk : styles.ringSel]} /> : null}
      <PicView pic={pic} size={size * 0.92} />
    </View>;
  }
  return <View style={[styles.card, { width: size, height: size, borderRadius: size * 0.2 }, state === "selected" && styles.selected, state === "ok" && styles.ok, state === "dim" && styles.dim, style]}>
    <PicView pic={pic} size={size} />
  </View>;
}

/** Short spoken caption under the top bar, for grown-ups watching; the child listens. */
export function Caption({ text }: { text: string }) {
  return <View style={styles.caption}><Text numberOfLines={2} style={styles.captionText}>{text}</Text></View>;
}

export function RoundDots({ total, done }: { total: number; done: number }) {
  return <View style={styles.dots}>{Array.from({ length: total }, (_, i) => <View key={i} style={[styles.dot, i < done && styles.dotOn]} />)}</View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "transparent", shadowColor: play.shadow, shadowOpacity: 0.14, shadowRadius: 8, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  selected: { borderColor: play.sun, backgroundColor: "#FFF8DC" },
  ok: { borderColor: play.leaf, backgroundColor: "#E3F8EA" },
  dim: { opacity: 0.35 },
  ring: { position: "absolute", borderWidth: 4 },
  ringOk: { borderColor: play.leaf },
  ringSel: { borderColor: play.sun },
  glyph: { ...playType.title, color: play.ink, textAlign: "center" },
  caption: { alignSelf: "center", maxWidth: "80%", backgroundColor: "rgba(255,255,255,0.88)", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4 },
  captionText: { ...playType.body, fontSize: 14, lineHeight: 18, color: play.ink, textAlign: "center" },
  dots: { flexDirection: "row", gap: 6 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.9)" },
  dotOn: { backgroundColor: play.leaf },
});
