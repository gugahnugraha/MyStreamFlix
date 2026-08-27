import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Lock, Eye, EyeOff, X, ShieldCheck, LogIn, UserPlus, AlertCircle } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  reason?: string;
  onAuthSuccess?: () => void;
}

export default function AuthModal({ visible, onClose, reason, onAuthSuccess }: AuthModalProps) {
  const { login, register } = useAuth();
  const { t } = useLanguage();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setError("");
    setShowPassword(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Email dan kata sandi wajib diisi.");
      return;
    }
    if (mode === "register" && !name.trim()) {
      setError("Nama lengkap wajib diisi.");
      return;
    }

    setLoading(true);
    const result =
      mode === "login"
        ? await login(email.trim().toLowerCase(), password)
        : await register(name.trim(), email.trim().toLowerCase(), password);
    setLoading(false);

    if (result.success) {
      resetForm();
      onAuthSuccess?.();
      onClose();
    } else {
      setError(result.error || "Terjadi kesalahan saat otentikasi.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.8}>
            <X size={18} color="#888" />
          </TouchableOpacity>

          <View style={styles.iconWrap}>
            <Lock size={26} color="#00ADB5" />
          </View>
          <Text style={styles.title}>{mode === "login" ? t.signIn : t.signUp}</Text>

          {reason ? (
            <View style={styles.reasonBox}>
              <ShieldCheck size={14} color="#00ADB5" />
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ) : null}

          {/* Mode Tabs */}
          <View style={styles.modeSwitcher}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === "login" && styles.modeBtnActive]}
              onPress={() => { setMode("login"); setError(""); }}
              activeOpacity={0.8}
            >
              <LogIn size={13} color={mode === "login" ? "#000" : "#888"} />
              <Text style={[styles.modeBtnText, mode === "login" && styles.modeBtnTextActive]}>{t.signIn}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mode === "register" && styles.modeBtnActive]}
              onPress={() => { setMode("register"); setError(""); }}
              activeOpacity={0.8}
            >
              <UserPlus size={13} color={mode === "register" ? "#000" : "#888"} />
              <Text style={[styles.modeBtnText, mode === "register" && styles.modeBtnTextActive]}>{t.signUp}</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {mode === "register" && (
              <TextInput
                style={styles.input}
                placeholder={t.fullName}
                placeholderTextColor="#555"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            )}
            <TextInput
              style={styles.input}
              placeholder={t.email}
              placeholderTextColor="#555"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder={t.password}
                placeholderTextColor="#555"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword((p) => !p)} style={styles.eyeBtn} activeOpacity={0.7}>
                {showPassword ? <EyeOff size={18} color="#888" /> : <Eye size={18} color="#888" />}
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <AlertCircle size={13} color="#FF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Quick Demo Chips */}
            <View style={styles.quickFill}>
              <Text style={styles.quickFillLabel}>1-Sentuhan:</Text>
              <TouchableOpacity
                style={styles.chip}
                onPress={() => { setEmail("admin@streamcms.com"); setPassword("admin123"); }}
                activeOpacity={0.8}
              >
                <Text style={styles.chipText}>👑 Admin</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.chip}
                onPress={() => { setEmail("user@streamcms.com"); setPassword("user123"); }}
                activeOpacity={0.8}
              >
                <Text style={styles.chipText}>👤 Viewer</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={styles.submitText}>{mode === "login" ? t.signIn : t.signUp}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  card: { width: "100%", maxWidth: 380, backgroundColor: "#111118", borderRadius: 20, padding: 22, borderWidth: 1, borderColor: "rgba(0,173,181,0.2)" },
  closeBtn: { position: "absolute", top: 14, right: 14, padding: 6, zIndex: 10 },
  iconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(0,173,181,0.12)", borderWidth: 1, borderColor: "rgba(0,173,181,0.3)", justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 10 },
  title: { color: "#FFF", fontSize: 18, fontWeight: "900", textAlign: "center", marginBottom: 8 },
  reasonBox: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "rgba(0,173,181,0.1)", borderWidth: 1, borderColor: "rgba(0,173,181,0.25)", borderRadius: 10, padding: 10, marginBottom: 12 },
  reasonText: { color: "#00ADB5", fontSize: 12, fontWeight: "600", flex: 1 },
  modeSwitcher: { flexDirection: "row", backgroundColor: "#1A1A24", borderRadius: 12, padding: 3, marginBottom: 14 },
  modeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 8, borderRadius: 10 },
  modeBtnActive: { backgroundColor: "#00ADB5" },
  modeBtnText: { color: "#888", fontSize: 12, fontWeight: "700" },
  modeBtnTextActive: { color: "#000" },
  form: { gap: 10 },
  input: { backgroundColor: "#1A1A24", borderWidth: 1, borderColor: "#2A2A38", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, color: "#FFF", fontSize: 13 },
  passwordRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#1A1A24", borderWidth: 1, borderColor: "#2A2A38", borderRadius: 12, paddingHorizontal: 14 },
  passwordInput: { flex: 1, paddingVertical: 11, color: "#FFF", fontSize: 13 },
  eyeBtn: { padding: 4 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,68,68,0.1)", borderRadius: 10, padding: 8, borderWidth: 1, borderColor: "rgba(255,68,68,0.25)" },
  errorText: { color: "#FF4444", fontSize: 11, fontWeight: "600", flex: 1 },
  quickFill: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  quickFillLabel: { color: "#555", fontSize: 11 },
  chip: { backgroundColor: "#1E1E2C", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 16, borderWidth: 1, borderColor: "#2A2A38" },
  chipText: { color: "#AAA", fontSize: 11, fontWeight: "600" },
  submitBtn: { backgroundColor: "#00ADB5", paddingVertical: 13, borderRadius: 14, alignItems: "center", marginTop: 4 },
  submitText: { color: "#000", fontWeight: "900", fontSize: 14 },
});