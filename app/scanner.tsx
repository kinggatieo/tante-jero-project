import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { supabase } from "../lib/supabaseClient";

export default function ScannerPage() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [message, setMessage] = useState("📷 Point the camera at a barcode");
  const [fadeAnim] = useState(new Animated.Value(0));
  // Ask for permission
  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  const showMessage = (text: string, duration = 2000) => {
    setMessage(text);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(duration),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleBarCodeScanned = async ({
    data,
    type,
  }: {
    data: string;
    type: string;
  }) => {
    if (scanned) return;
    setScanned(true);
    console.log("Scanned:", type, data);

    try {
      // 1️⃣ Find item in Supabase
      const { data: items, error: itemError } = await supabase
        .from("items")
        .select("*")
        .eq("barcode", data)
        .limit(1);

      if (itemError) throw itemError;

      if (!items || items.length === 0) {
        showMessage(`⚠️ Item not found for barcode: ${data}`);
        setTimeout(() => setScanned(false), 2000);
        return;
      }

      const item = items[0];

      // 2️⃣ Record sale
      const { error: saleError } = await supabase.from("sales").insert([
        {
          item_id: item.id,
          barcode: item.barcode,
          item_name: item.name,
          quantity: 1,
          sale_price: item.price,
        },
      ]);
      if (saleError) throw saleError;

      // 3️⃣ Reduce stock
      const { error: stockError } = await supabase
        .from("items")
        .update({ stock: item.stock - 1 })
        .eq("id", item.id);
      if (stockError) throw stockError;

      // 4️⃣ Show success
      showMessage(`✅ ${item.name} scanned successfully!`);
      setTimeout(() => setScanned(false), 2000);
    } catch (err) {
      console.error("Scan error:", err);
      showMessage("❌ Error processing barcode");
      setTimeout(() => setScanned(false), 2000);
    }
  };

  if (!permission) {
    return <Text>Requesting camera permission...</Text>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text>Camera access is required to scan barcodes.</Text>
        <Text onPress={requestPermission} style={styles.link}>
          Grant Permission
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "code128"],
        }}
        onBarcodeScanned={handleBarCodeScanned}
      />

      {/* 🟢 Animated feedback message */}
      <Animated.View style={[styles.feedbackBox, { opacity: fadeAnim }]}>
        <Text style={styles.feedbackText}>{message}</Text>
      </Animated.View>

      {/* Static text overlay */}
      <View style={styles.overlay}>
        <Text style={styles.instructionText}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  overlay: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  instructionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  link: {
    color: "#007AFF",
    marginTop: 10,
    fontWeight: "bold",
  },
  feedbackBox: {
    position: "absolute",
    top: 80,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  feedbackText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
