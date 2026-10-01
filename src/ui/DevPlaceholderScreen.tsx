import type { Href } from "expo-router";
import { Link } from "expo-router";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { namyTypography } from "./typography";

type PlaceholderLink = {
  label: string;
  href: Href;
};

type DevPlaceholderScreenProps = {
  stateCode: string;
  title: string;
  description: string;
  links?: readonly PlaceholderLink[];
};

/** Build Pass 1 route proof; this is explicitly not final child-facing UI. */
export function DevPlaceholderScreen({
  stateCode,
  title,
  description,
  links = []
}: DevPlaceholderScreenProps) {
  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.kicker}>
          DEV_PLACEHOLDER / {stateCode}
        </Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.notice}>
          Build Pass 1 route skeleton only. Final visual integration belongs to Build Pass 3.
        </Text>
        {links.map((link) => (
          <Link key={link.label} accessibilityRole="link" href={link.href} style={styles.link}>
            {link.label}
          </Link>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F5F1E7", padding: 24 },
  card: {
    flex: 1,
    justifyContent: "center",
    borderRadius: 28,
    backgroundColor: "#FFFDF7",
    padding: 28,
    shadowColor: "#2D4436",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3
  },
  kicker: { ...namyTypography.child.caption, color: "#78563B" },
  title: { ...namyTypography.child.title, color: "#204436", marginTop: 14 },
  description: { ...namyTypography.child.body, color: "#40564B", marginTop: 16 },
  notice: { ...namyTypography.child.caption, color: "#78563B", marginTop: 24 },
  link: { ...namyTypography.child.button, color: "#0E6B50", marginTop: 18, paddingVertical: 12 }
});
