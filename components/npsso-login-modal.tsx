import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import WebView from "react-native-webview";

export interface NpssoLoginModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (npsso: string) => void;
}

const LOGIN_URL = "https://id.sonyentertainmentnetwork.com/id/management/";
const SSO_COOKIE_URL = "https://ca.account.sony.com/api/v1/ssocookie";

export function NpssoLoginModal({
  visible,
  onClose,
  onSuccess,
}: NpssoLoginModalProps) {
  const [currentUrl, setCurrentUrl] = useState(LOGIN_URL);
  const [isLoading, setIsLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);
  const hasVisitedSignIn = useRef(false);

  const handleNavigationStateChange = (navState: any) => {
    const url = navState.url;

    if (url.includes("signin")) {
      hasVisitedSignIn.current = true;
    }

    // If we reached the management dashboard, the user is signed in.
    // Time to fetch the SSO cookie page.
    if (
      (hasVisitedSignIn.current || !navState.loading) &&
      url.startsWith(LOGIN_URL) &&
      currentUrl !== SSO_COOKIE_URL
    ) {
      setCurrentUrl(SSO_COOKIE_URL);
    }
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "npsso" && data.value) {
        onSuccess(data.value);
      } else if (data.type === "error") {
        console.warn("NPSSO Extraction error:", data.message);
      }
    } catch (e) {
      // Ignore invalid JSON messages
    }
  };

  const injectedJavaScript = `
    (function() {
      if (window.location.href.includes('ssocookie')) {
        try {
          var text = document.body.innerText;
          var json = JSON.parse(text);
          if (json.npsso) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'npsso', value: json.npsso }));
          } else {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'No NPSSO in JSON response' }));
          }
        } catch (e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: e.message }));
        }
      }
    })();
    true;
  `;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>PlayStation Sign In</Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="close" size={24} color="#FFF" />
          </Pressable>
        </View>
        <View style={styles.webviewContainer}>
          <WebView
            ref={webViewRef}
            source={{ uri: currentUrl }}
            style={styles.webview}
            onNavigationStateChange={handleNavigationStateChange}
            onMessage={handleMessage}
            injectedJavaScript={injectedJavaScript}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            incognito={false}
          />
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#0070D1" />
              <Text style={styles.loadingText}>
                {currentUrl === SSO_COOKIE_URL
                  ? "Finalizing Login..."
                  : "Loading Sony..."}
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "#000",
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "600",
  },
  closeButton: {
    position: "absolute",
    right: 16,
    padding: 4,
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#FFF",
    marginTop: 12,
    fontSize: 15,
    fontWeight: "500",
  },
});
