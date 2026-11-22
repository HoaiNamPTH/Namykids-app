import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { foundationAssets } from "../../ui/foundation-assets";
import { playType } from "../../ui/typography";
import { PASSWORD_MIN, signIn, signUp, useSession, type AuthError } from "../account/account";
import { TRIAL_DAYS } from "../account/access";
import { play } from "../theme";
import { PlayScreen, Sub, Title } from "../ui";

const ERRORS: Record<AuthError, string> = {
  email: "Email chưa đúng. Bố mẹ xem lại giúp nhé.",
  "password-short": `Mật khẩu cần ít nhất ${PASSWORD_MIN} ký tự.`,
  exists: "Email này đã có tài khoản. Bố mẹ chọn Đăng nhập nhé.",
  "no-account": "Chưa có tài khoản với email này. Bố mẹ chọn Tạo tài khoản nhé.",
  "wrong-password": "Mật khẩu chưa đúng.",
};

/** Parent sign-up / sign-in. The session is remembered, so this shows once per device. */
export function LoginScreen({ onDone }: { onDone: () => void }) {
  const { account } = useSession();
  const [mode, setMode] = useState<"up" | "in">(account ? "in" : "up");
  const [email, setEmail] = useState(account?.email ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const result = mode === "up" ? signUp(email, password) : signIn(email, password);
    if (result) { setError(ERRORS[result]); return; }
    onDone();
  };

  return <PlayScreen style={styles.row}>
    <View style={styles.left}>
      <Text style={styles.logo}>NamyKids</Text>
      <Image accessible={false} source={foundationAssets.namiGuide} resizeMode="contain" style={styles.nami} />
    </View>
    <View style={styles.card}>
      <Title size={24}>{mode === "up" ? "Tạo tài khoản cho bé" : "Chào mừng bố mẹ trở lại"}</Title>
      <Sub>{mode === "up" ? `Dùng thử đầy đủ ${TRIAL_DAYS} ngày, không cần thẻ thanh toán.` : "Đăng nhập một lần, lần sau app tự nhớ."}</Sub>
      <View style={styles.tabs}>
        {(["up", "in"] as const).map((m) => <Pressable key={m} accessibilityRole="button" accessibilityState={{ selected: mode === m }} onPress={() => { setMode(m); setError(null); }}
          style={[styles.tab, mode === m && styles.tabOn]}><Text style={[styles.tabText, mode === m && styles.tabTextOn]}>{m === "up" ? "Tạo tài khoản" : "Đăng nhập"}</Text></Pressable>)}
      </View>
      <TextInput accessibilityLabel="Email" placeholder="Email của bố mẹ" placeholderTextColor="#9AA3BF" value={email} onChangeText={setEmail}
        autoCapitalize="none" autoComplete="email" keyboardType="email-address" style={styles.input} />
      <TextInput accessibilityLabel="Mật khẩu" placeholder={`Mật khẩu (ít nhất ${PASSWORD_MIN} ký tự)`} placeholderTextColor="#9AA3BF" value={password} onChangeText={setPassword}
        secureTextEntry autoComplete={mode === "up" ? "new-password" : "current-password"} onSubmitEditing={submit} style={styles.input} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable accessibilityRole="button" onPress={submit} style={({ pressed }) => [styles.go, pressed && styles.pressed]}>
        <Text style={styles.goText}>{mode === "up" ? "Bắt đầu dùng thử" : "Đăng nhập"}</Text>
      </Pressable>
      <Text style={styles.note}>Bản xem trước: tài khoản chỉ lưu trên máy này, chưa gửi lên máy chủ.</Text>
    </View>
  </PlayScreen>;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 16, alignItems: "center" },
  left: { width: "30%", height: "100%", justifyContent: "flex-end" },
  logo: { ...playType.title, fontSize: 32, color: "#6A3FD8" },
  nami: { flex: 1, width: "100%" },
  card: { flex: 1, maxWidth: 460, backgroundColor: play.panel, borderRadius: 26, padding: 16, gap: 8 },
  tabs: { flexDirection: "row", gap: 6 },
  tab: { flex: 1, minHeight: 38, borderRadius: 19, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  tabOn: { backgroundColor: play.blue },
  tabText: { ...playType.bodyBold, fontSize: 14, color: play.ink },
  tabTextOn: { color: "#FFFFFF" },
  input: { ...playType.body, fontSize: 15, color: play.ink, backgroundColor: "#FFFFFF", borderRadius: 14, paddingHorizontal: 12, minHeight: 42, borderWidth: 2, borderColor: "#E2E7F2" },
  error: { ...playType.bodyBold, fontSize: 13, color: "#D8434E" },
  go: { minHeight: 46, borderRadius: 23, backgroundColor: play.leaf, alignItems: "center", justifyContent: "center", borderBottomWidth: 4, borderBottomColor: "#1E8A5C" },
  goText: { ...playType.title, fontSize: 18, color: "#FFFFFF" },
  note: { ...playType.body, fontSize: 11, color: play.soft, textAlign: "center" },
  pressed: { transform: [{ scale: 0.97 }] },
});
