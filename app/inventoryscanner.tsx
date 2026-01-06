import { Picker } from "@react-native-picker/picker"; // dropdown
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabaseClient";

export default function InventoryScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [barcode, setBarcode] = useState<string | null>(null);
  const [itemName, setItemName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 🔸 Ambil kategori dari Supabase
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("categories")
        .select("id, name");
      if (error) {
        console.error("Gagal ambil kategori:", error);
        Alert.alert("Error", "Tidak dapat memuat kategori.");
      } else {
        setCategories(data);
      }
      setLoading(false);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    setBarcode(data);
    Alert.alert("Barcode Terdeteksi", `Kode: ${data}`);
  };

  const handleSave = async () => {
    if (!barcode)
      return Alert.alert("Peringatan", "Tidak ada barcode yang dipindai.");
    if (!itemName || !price)
      return Alert.alert("Peringatan", "Nama barang dan harga harus diisi!");
    if (!categoryId)
      return Alert.alert(
        "Peringatan",
        "Pilih kategori barang terlebih dahulu!"
      );

    const stockNum = parseInt(stock);
    const priceNum = parseInt(price);

    // Cek apakah item sudah ada
    const { data: existingItem, error: fetchError } = await supabase
      .from("items")
      .select("*")
      .eq("barcode", barcode)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error(fetchError);
      return Alert.alert("Gagal", "Terjadi kesalahan saat memeriksa barang.");
    }

    if (existingItem) {
      // Barang sudah ada → update stok
      const { error: updateError } = await supabase
        .from("items")
        .update({ stock: existingItem.stock + stockNum })
        .eq("id", existingItem.id);

      if (updateError) {
        console.error(updateError);
        Alert.alert("Gagal", "Tidak dapat memperbarui stok barang.");
      } else {
        Alert.alert("Berhasil ✅", "Stok barang berhasil diperbarui!");
        router.back();
      }
    } else {
      // Barang baru → tambahkan ke database
      const { error: insertError } = await supabase.from("items").insert([
        {
          name: itemName,
          barcode: barcode,
          stock: stockNum,
          price_idr: priceNum,
          category_id: categoryId,
        },
      ]);

      if (insertError) {
        console.error(insertError);
        Alert.alert("Gagal", "Tidak dapat menambahkan barang baru.");
      } else {
        Alert.alert("Berhasil ✅", "Barang baru berhasil ditambahkan!");
        router.back();
      }
    }
  };

  if (!permission) return <Text>Memeriksa izin kamera...</Text>;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>
          Aplikasi membutuhkan izin kamera untuk memindai barcode.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Izinkan Kamera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: "#fff" }]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Memuat kategori...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!scanned ? (
        <>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          />
          <View style={styles.overlay}>
            <Text style={styles.scanText}>Arahkan kamera ke barcode...</Text>
          </View>
        </>
      ) : (
        <View style={styles.form}>
          <Text style={styles.title}>📦 Tambah Barang</Text>

          <Text style={styles.label}>Kode Barcode</Text>
          <TextInput
            style={styles.input}
            value={barcode || ""}
            editable={false}
          />

          <Text style={styles.label}>Nama Barang</Text>
          <TextInput
            style={styles.input}
            placeholder="Masukkan nama barang"
            value={itemName}
            onChangeText={setItemName}
          />

          <Text style={styles.label}>Harga (Rp)</Text>
          <TextInput
            style={styles.input}
            placeholder="Masukkan harga barang"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />

          <Text style={styles.label}>Stok</Text>
          <TextInput
            style={styles.input}
            placeholder="Masukkan jumlah stok"
            keyboardType="numeric"
            value={stock}
            onChangeText={setStock}
          />

          <Text style={styles.label}>Kategori</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={categoryId}
              onValueChange={(value) => setCategoryId(value)}
            >
              <Picker.Item label="Pilih kategori..." value={null} />
              {categories.map((cat) => (
                <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
              ))}
            </Picker>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSave}>
            <Text style={styles.buttonText}>💾 Simpan Barang</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#888" }]}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.buttonText}>🔁 Pindai Ulang</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", justifyContent: "center" },
  overlay: {
    position: "absolute",
    bottom: 50,
    width: "100%",
    alignItems: "center",
  },
  scanText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  form: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: { fontSize: 16, fontWeight: "500", marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 20,
    overflow: "hidden",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
