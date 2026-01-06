import { Ionicons } from "@expo/vector-icons"; // ✅ for arrow icon
import { useRouter } from "expo-router"; // ✅ import router
import React, { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabaseClient";

export default function HomeScreen() {
  const router = useRouter(); // ✅ initialize router
  const [sales, setSales] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  // Fetch today’s sales
  const fetchSales = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .gte("date", today);

    if (!error && data) {
      setSales(data);
      const sum = data.reduce((acc, s) => acc + (s.totalPrice || 0), 0);
      setTotal(sum);
    }
  };

  // Subscribe to real-time sales
  useEffect(() => {
    fetchSales();

    const subscription = supabase
      .channel("sales-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sales" },
        (payload) => {
          console.log("New sale event:", payload);
          fetchSales(); // refresh
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // ✅ Logout handler (optional)
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/register"); // Go back to login page
  };

  return (
    <View style={styles.container}>
      {/* 🔙 Back / Logout Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleLogout}>
        <Ionicons name="arrow-back" size={24} color="#007AFF" />
        <Text style={styles.backText}>Kembali ke Login</Text>
      </TouchableOpacity>

      <Text style={styles.title}>🏪 Dashboard Penjualan</Text>
      <Text style={styles.summary}>Total Penjualan Hari Ini:</Text>
      <Text style={styles.amount}>Rp {total.toLocaleString("id-ID")}</Text>

      <Text style={styles.subTitle}>🧾 Transaksi Terbaru</Text>
      <FlatList
        data={sales.slice(0, 5)}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.itemName}>{item.itemName}</Text>
            <Text>Jumlah: {item.quantity}</Text>
            <Text>Harga: Rp {item.totalPrice.toLocaleString("id-ID")}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ color: "#777", textAlign: "center", marginTop: 20 }}>
            Belum ada transaksi hari ini
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  backText: {
    marginLeft: 6,
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  summary: { fontSize: 18, textAlign: "center" },
  amount: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#007AFF",
    marginVertical: 10,
  },
  subTitle: { fontSize: 20, fontWeight: "600", marginVertical: 15 },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  itemName: { fontWeight: "bold", fontSize: 16 },
});
