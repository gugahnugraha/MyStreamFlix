import React, { createContext, useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
} from "react-native";
import {
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  Trash2,
  HelpCircle,
  Sparkles,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

export type DialogType = "success" | "error" | "warning" | "info" | "confirm" | "delete";

interface DialogConfig {
  type?: DialogType;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  isDestructive?: boolean;
}

interface ModernDialogContextType {
  showDialog: (config: DialogConfig) => void;
  showSuccess: (title: string, message?: string, onConfirm?: () => void) => void;
  showError: (title: string, message?: string) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText?: string,
    cancelText?: string,
    isDestructive?: boolean
  ) => void;
  showDeleteConfirm: (
    title: string,
    message: string,
    onConfirm: () => void
  ) => void;
  hideDialog: () => void;
}

const ModernDialogContext = createContext<ModernDialogContextType>({
  showDialog: () => {},
  showSuccess: () => {},
  showError: () => {},
  showConfirm: () => {},
  showDeleteConfirm: () => {},
  hideDialog: () => {},
});

export const ModernDialogProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<DialogConfig | null>(null);

  const showDialog = (cfg: DialogConfig) => {
    setConfig(cfg);
    setVisible(true);
  };

  const hideDialog = () => {
    setVisible(false);
    setConfig(null);
  };

  const showSuccess = (title: string, message?: string, onConfirm?: () => void) => {
    showDialog({
      type: "success",
      title,
      message,
      confirmText: "Mengerti",
      onConfirm: () => {
        hideDialog();
        if (onConfirm) onConfirm();
      },
    });
  };

  const showError = (title: string, message?: string) => {
    showDialog({
      type: "error",
      title,
      message,
      confirmText: "Tutup",
      onConfirm: hideDialog,
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText: string = "Konfirmasi",
    cancelText: string = "Batal",
    isDestructive: boolean = false
  ) => {
    showDialog({
      type: isDestructive ? "delete" : "confirm",
      title,
      message,
      confirmText,
      cancelText,
      isDestructive,
      onConfirm: () => {
        hideDialog();
        onConfirm();
      },
      onCancel: hideDialog,
    });
  };

  const showDeleteConfirm = (
    title: string,
    message: string,
    onConfirm: () => void
  ) => {
    showConfirm(title, message, onConfirm, "Hapus", "Batal", true);
  };

  const renderIcon = () => {
    switch (config?.type) {
      case "success":
        return (
          <View style={[styles.iconCircle, { backgroundColor: "rgba(16,185,129,0.15)", borderColor: "#10B981" }]}>
            <CheckCircle size={28} color="#10B981" />
          </View>
        );
      case "error":
        return (
          <View style={[styles.iconCircle, { backgroundColor: "rgba(229,9,20,0.15)", borderColor: "#E50914" }]}>
            <XCircle size={28} color="#E50914" />
          </View>
        );
      case "delete":
        return (
          <View style={[styles.iconCircle, { backgroundColor: "rgba(229,9,20,0.15)", borderColor: "#E50914" }]}>
            <Trash2 size={26} color="#E50914" />
          </View>
        );
      case "warning":
        return (
          <View style={[styles.iconCircle, { backgroundColor: "rgba(251,191,36,0.15)", borderColor: "#FBBF24" }]}>
            <AlertTriangle size={26} color="#FBBF24" />
          </View>
        );
      case "confirm":
        return (
          <View style={[styles.iconCircle, { backgroundColor: "rgba(0,173,181,0.15)", borderColor: "#00ADB5" }]}>
            <HelpCircle size={26} color="#00ADB5" />
          </View>
        );
      default:
        return (
          <View style={[styles.iconCircle, { backgroundColor: "rgba(0,173,181,0.15)", borderColor: "#00ADB5" }]}>
            <Sparkles size={26} color="#00ADB5" />
          </View>
        );
    }
  };

  return (
    <ModernDialogContext.Provider
      value={{
        showDialog,
        showSuccess,
        showError,
        showConfirm,
        showDeleteConfirm,
        hideDialog,
      }}
    >
      {children}

      {visible && (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={hideDialog}>
          <View style={styles.overlay}>
            <View style={styles.dialogCard}>
              {/* Top Icon */}
              {renderIcon()}

              {/* Title & Message */}
              <Text style={styles.titleText}>{config?.title}</Text>
              {config?.message ? (
                <Text style={styles.messageText}>{config.message}</Text>
              ) : null}

              {/* Action Buttons */}
              <View style={styles.buttonRow}>
                {config?.cancelText ? (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={config.onCancel || hideDialog}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelBtnText}>{config.cancelText}</Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={[
                    styles.confirmBtn,
                    config?.isDestructive && styles.confirmBtnDestructive,
                    !config?.cancelText && { flex: 1 },
                  ]}
                  onPress={config?.onConfirm || hideDialog}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.confirmBtnText,
                      config?.isDestructive && styles.confirmBtnTextDestructive,
                    ]}
                  >
                    {config?.confirmText || "OK"}
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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.82)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  dialogCard: {
    width: Math.min(width - 48, 360),
    backgroundColor: "#121216",
    borderRadius: 24,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#24242E",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    marginBottom: 16,
  },
  titleText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  messageText: {
    color: "#999",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#1C1C24",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2E2E3A",
  },
  cancelBtnText: {
    color: "#AAA",
    fontSize: 13,
    fontWeight: "bold",
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: "#00ADB5",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  confirmBtnDestructive: {
    backgroundColor: "#E50914",
  },
  confirmBtnText: {
    color: "#000",
    fontSize: 13,
    fontWeight: "900",
  },
  confirmBtnTextDestructive: {
    color: "#FFF",
  },
});
