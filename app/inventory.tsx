import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";

import { Picker } from "@react-native-picker/picker";
import {
  Alert,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabaseClient";

export default function InventoryScreen() {
  const [items, setItems] = useState<any[]>([]);
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [newItem, setNewItem] = useState({
    name: "",
    barcode: "",
    stock: 0,
    price_idr: 0,
    category_id: null,
  });

  // ✅ Format Rupiah helper
  const formatRupiah = (number: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(number);

  // ✅ Fetch categories
  const fetchCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*");
    if (!error) setCategories(data || []);
  };

  // ✅ Fetch items (with filter)
  const fetchItems = async (filter = "all") => {
    let query = supabase
      .from("items")
      .select(
        "id, name, barcode, stock, price_idr, category_id, categories(name)"
      )
      .order("id", { ascending: true });

    if (filter !== "all") {
      query = query.eq("category_id", Number(filter));
    }

    const { data, error } = await query;
    if (error) {
      console.error("❌ Supabase error:", error);
    } else {
      setItems(data || []);
    }
  };

  // ✅ Add new item
  const addItem = async () => {
    if (!newItem.name || !newItem.barcode)
      return Alert.alert("⚠️", "Mohon isi semua kolom yang diperlukan!");

    const { error } = await supabase.from("items").insert([newItem]);
    if (error) {
      console.error(error);
      Alert.alert("❌", "Gagal menambahkan barang!");
    } else {
      Alert.alert("✅", "Barang berhasil ditambahkan!");
      setNewItem({
        name: "",
        barcode: "",
        stock: 0,
        price_idr: 0,
        category_id: null,
      });
      fetchItems(selectedCategory);
    }
  };

  const deleteItem = async (id: string | number, name: string) => {
    Alert.alert("Hapus Barang", `Yakin ingin menghapus ${name}?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase
            .from("items")
            .delete()
            .eq("id", id.toString()); // ✅ make sure it's a string
          if (error) {
            console.error("Delete error:", error);
            Alert.alert("❌", "Gagal menghapus barang!");
          } else {
            Alert.alert("🗑️", `${name} telah dihapus.`);
            fetchItems(selectedCategory);
          }
        },
      },
    ]);
  };

  useEffect(() => {
    fetchCategories();
    fetchItems();
  }, []);

  useEffect(() => {
    fetchItems(selectedCategory);
  }, [selectedCategory]);

  // ✅ Render item row
  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text>Barcode: {item.barcode}</Text>
        <Text>Stok: {item.stock}</Text>
        <Text>Harga: {formatRupiah(item.price_idr)}</Text>
        <Text>Kategori: {item.categories?.name || "Tidak ada"}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteItem(item.id, item.name)}
      >
        <Text style={styles.deleteButtonText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 16 }}
      ListHeaderComponent={
        <>
          <Text style={styles.title}>📦 Inventory Management</Text>

          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => router.push("/inventoryscanner")}
          >
            <Text style={styles.scanText}>📷 Add Item (Scan Barcode)</Text>
          </TouchableOpacity>

          {/* Input Form */}
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Nama Barang"
              value={newItem.name}
              onChangeText={(t) => setNewItem({ ...newItem, name: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Barcode"
              value={newItem.barcode}
              onChangeText={(t) => setNewItem({ ...newItem, barcode: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Jumlah Stok"
              keyboardType="numeric"
              value={newItem.stock ? newItem.stock.toString() : ""}
              onChangeText={(t) => setNewItem({ ...newItem, stock: Number(t) })}
            />
            <TextInput
              style={styles.input}
              placeholder="Harga (Rp)"
              keyboardType="numeric"
              value={newItem.price_idr ? newItem.price_idr.toString() : ""}
              onChangeText={(t) =>
                setNewItem({ ...newItem, price_idr: Number(t) })
              }
            />

            <Text style={styles.label}>Kategori Barang</Text>
            <Picker
              selectedValue={newItem.category_id}
              onValueChange={(val) =>
                setNewItem({ ...newItem, category_id: val })
              }
              style={styles.picker}
            >
              <Picker.Item label="Pilih kategori..." value={null} />
              {categories.map((cat) => (
                <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
              ))}
            </Picker>

            <Button title="Tambah Barang" onPress={addItem} />
          </View>

          {/* Filter */}
          <Text style={styles.subtitle}>🧾 Daftar Barang</Text>
          <View style={styles.filterBox}>
            <Text style={styles.filterLabel}>Filter Kategori:</Text>
            <Picker
              selectedValue={selectedCategory}
              onValueChange={(val) => setSelectedCategory(val)}
              style={styles.picker}
            >
              <Picker.Item label="Semua Kategori" value="all" />
              {categories.map((cat) => (
                <Picker.Item
                  key={cat.id}
                  label={cat.name}
                  value={cat.id.toString()}
                />
              ))}
            </Picker>
          </View>
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: { fontSize: 20, fontWeight: "600", marginVertical: 10 },
  form: {
    marginBottom: 20,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  input: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
    fontSize: 16,
  },
  picker: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 10,
  },
  label: { fontSize: 16, fontWeight: "500", marginBottom: 5 },
  filterBox: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  filterLabel: { fontSize: 16, fontWeight: "500", marginBottom: 5 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  name: { fontWeight: "bold", fontSize: 18, marginBottom: 4 },
  deleteButton: {
    marginLeft: 10,
    backgroundColor: "#ff5252",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  deleteButtonText: { color: "#fff", fontSize: 16 },
  scanBtn: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  scanText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
