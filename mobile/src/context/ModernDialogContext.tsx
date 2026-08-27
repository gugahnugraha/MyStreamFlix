import React, { createContext, useContext, useState } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { CheckCircle, AlertTriangle, Info, Trash2, X } from "lucide-react-native";

interface DialogConfig {
  type?: "success" | "error" | "warning" | "info" | "delete";
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ModernDialogContextType {
  showSuccess: (title: string, message?: string, onConfirm?: () => void) => void;
  showError: (title: string, message?: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string) => void;
  showDeleteConfirm: (title: string, message: string, onConfirm: () => void) => void;
  hideDialog: () => void;
}

const ModernDialogContext = createContext<ModernDialogContextType>({
  showSuccess: () => {},
  showError: () => {},
  showConfirm: () => {},
  showDeleteConfirm: () => {},
  hideDialog: () => {},
});

export const ModernDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialogConfig, setDialogConfig] = useState<DialogConfig | null>(null);

  const hideDialog = () => setDialogConfig(null);

  const showSuccess = (title: string, message?: string, onConfirm?: () => void) => {
    setDialogConfig({ type: "success", title, message, onConfirm });
  };

  const showError = (title: string, message?: string) => {
    setDialogConfig({ type: "error", title, message });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void, confirmText = "Konfirmasi", cancelText = "Batal") => {
    setDialogConfig({ type: "warning", title, message, onConfirm, confirmText, cancelText });
  };

  const showDeleteConfirm = (title: string, message: string, onConfirm: () => void) => {
    setDialogConfig({ type: "delete", title, message, onConfirm, confirmText: "Hapus", cancelText: "Batal" });
  };

  return (
    <ModernDialogContext.Provider value={{ showSuccess, showError, showConfirm, showDeleteConfirm, hideDialog }}>
      {children}

      {dialogConfig && (
        <Modal visible transparent animationType="fade" onRequestClose={hideDialog}>
          <View style={styles.backdrop}>
            <View style={styles.card}>
              <TouchableOpacity style={styles.closeBtn} onPress={hideDialog}>
                <X size={16} color="#777" />
              </TouchableOpacity>

              <View style={styles.iconWrap}>
                {dialogConfig.type === "success" && <CheckCircle size={32} color="#10B981" />}
                {dialogConfig.type === "error" && <AlertTriangle size={32} color="#FF4444" />}
                {dialogConfig.type === "delete" && <Trash2 size={32} color="#FF4444" />}
                {(dialogConfig.type === "warning" || dialogConfig.type === "info" || !dialogConfig.type) && (
                  <Info size={32} color="#00ADB5" />
                )}
              </View>

              <Text style={styles.title}>{dialogConfig.title}</Text>
              {dialogConfig.message ? <Text style={styles.message}>{dialogConfig.message}</Text> : null}

              <View style={styles.actions}>
                {dialogConfig.cancelText && (
                  <TouchableOpacity style={styles.cancelBtn} onPress={hideDialog}>
                    <Text style={styles.cancelText}>{dialogConfig.cancelText}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.confirmBtn,
                    dialogConfig.type === "delete" && { backgroundColor: "#FF4444" },
                  ]}
                  onPress={() => {
                    const cb = dialogConfig.onConfirm;
                    hideDialog();
                    cb?.();
                  }}
                >
                  <Text style={[styles.confirmText, dialogConfig.type === "delete" && { color: "#FFF" }]}>
                    {dialogConfig.confirmText || "OK"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ModernDialogContext.Provider>
  );
};

export const useModernDialog = () => useContext(ModernDialogContext);

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", alignItems: "center", padding: 24 },
  card: { width: "100%", maxWidth: 380, backgroundColor: "#14141E", borderRadius: 20, padding: 24, borderWidth: 1, borderColor: "rgba(0,173,181,0.2)" },
  closeBtn: { position: "absolute", top: 14, right: 14, padding: 6 },
  iconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#1C1C28", justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 14 },
  title: { color: "#FFF", fontSize: 18, fontWeight: "900", textAlign: "center", marginBottom: 8 },
  message: { color: "#AAA", fontSize: 13, textAlign: "center", lineHeight: 18, marginBottom: 20 },
  actions: { flexDirection: "row", gap: 10, justifyContent: "center" },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: "#222230", alignItems: "center" },
  cancelText: { color: "#AAA", fontWeight: "700", fontSize: 13 },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: "#00ADB5", alignItems: "center" },
  confirmText: { color: "#000", fontWeight: "900", fontSize: 13 },
});