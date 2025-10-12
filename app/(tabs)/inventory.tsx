import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { supabase } from "././lib/supabaseClient";

export default function InventoryScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [newItem, setNewItem] = useState({
    name: "",
    barcode: "",
    stock: 0,
    price_idr: 0,
    category_id: null,
  });

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

  const fetchItems = async (filter = "all") => {
    console.log("🔎 Filter value:", filter);
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
      console.log("✅ Supabase data:", data);
      setItems(data || []);
    }
  };

  const addItem = async () => {
    if (!newItem.name || !newItem.barcode)
      return alert("Mohon isi semua kolom yang diperlukan!");
    const { error } = await supabase.from("items").insert([newItem]);
    if (error) console.error(error);
    else {
      alert("✅ Barang berhasil ditambahkan!");
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

  useEffect(() => {
    fetchCategories();
    fetchItems();
  }, []);

  useEffect(() => {
    fetchItems(selectedCategory);
  }, [selectedCategory]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📦 Inventory Management</Text>

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
          onChangeText={(t) => setNewItem({ ...newItem, price_idr: Number(t) })}
        />

        <Text style={styles.label}>Kategori Barang</Text>
        <Picker
          selectedValue={newItem.category_id}
          onValueChange={(val) => setNewItem({ ...newItem, category_id: val })}
          style={styles.picker}
        >
          <Picker.Item label="Pilih kategori..." value={null} />
          {categories.map((cat) => (
            <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
          ))}
        </Picker>

        <Button title="Tambah Barang" onPress={addItem} />
      </View>

      {/* Filter Dropdown */}
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

      {/* Item List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text>Kategori: {item.categories?.name || "Tanpa Kategori"}</Text>
            <Text>Barcode: {item.barcode}</Text>
            <Text>Stok: {item.stock}</Text>
            <Text>
              Harga: {item.price_idr ? formatRupiah(item.price_idr) : "Rp0"}
            </Text>
          </View>
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 20 },
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
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  name: { fontWeight: "bold", fontSize: 18, marginBottom: 4 },
});
