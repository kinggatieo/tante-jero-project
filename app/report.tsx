import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabaseClient";

// Rupiah formatter
const rupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value || 0);

export default function DailyReportScreen() {
  const [data, setData] = useState<any[]>([]);
  const [recentItem, setRecentItem] = useState<any | null>(null);
  const [recentSale, setRecentSale] = useState<any | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { barcode } = useLocalSearchParams();

  // 🟦 Fetch daily sales
  const fetchReport = async () => {
    setRefreshing(true);
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("sales")
      .select("*, items(name, price_idr, barcode, category_id)")
      .gte("created_at", `${today}T00:00:00`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch report error:", error);
    } else {
      setData(data || []);
    }

    setRefreshing(false);
  };

  // 🟩 Fetch scanned item info
  const fetchScannedItem = async (barcodeValue: string) => {
    const { data, error } = await supabase
      .from("items")
      .select("id, name")
      .eq("barcode", barcodeValue)
      .single();

    if (error) {
      console.error("Fetch scanned item error:", error);
      setRecentItem(null);
    } else {
      setRecentItem(data);
    }
  };

  // 🟨 Fetch item info for new sale
  const fetchSaleItem = async (itemId: string) => {
    const { data, error } = await supabase
      .from("items")
      .select("name, barcode, category, price_idr")
      .eq("id", itemId)
      .single();

    if (!error && data) {
      setRecentSale(data);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  useEffect(() => {
    if (barcode) fetchScannedItem(barcode as string);
  }, [barcode]);

  // 🟥 Listen for realtime sales
  useEffect(() => {
    const channel = supabase
      .channel("sales-listener")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sales" },
        async (payload) => {
          const newSale = payload.new;
          console.log("🆕 New sale detected:", newSale);

          if (newSale.item_id) await fetchSaleItem(newSale.item_id);
          await fetchReport();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Laporan Penjualan Harian</Text>

      {/* 📷 Scanner Button */}
      <TouchableOpacity
        style={styles.scanBtn}
        onPress={() => router.push("/scanner")}
      >
        <Text style={styles.scanText}>📷 Buka Pemindai Barcode</Text>
      </TouchableOpacity>

      {/* 🆕 Recently Scanned Item */}
      {recentItem && (
        <View style={styles.recentCard}>
          <Text style={styles.recentTitle}>🆕 Barang Terpindai</Text>
          <Text style={styles.name}>{recentItem.name}</Text>
        </View>
      )}

      {/* 🛒 Recently Sold Item */}
      {recentSale && (
        <View style={[styles.recentCard, { backgroundColor: "#e9ffe8" }]}>
          <Text style={[styles.recentTitle, { color: "#28a745" }]}>
            🛒 Barang Terjual
          </Text>
          <Text style={styles.name}>{recentSale.name}</Text>
          <Text style={styles.qty}>
            Harga: {rupiah(recentSale.price_idr || 0)}
          </Text>
          <Text style={styles.qty}>Kategori: {recentSale.category}</Text>
          <Text style={styles.qty}>Barcode: {recentSale.barcode}</Text>
        </View>
      )}

      {/* 🧾 Sales List */}
      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchReport} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>
              {item.items?.name || "Nama Barang Tidak Ada"}
            </Text>
            <Text style={styles.qty}>Jumlah: {item.quantity || 1}</Text>
            <Text style={styles.qty}>
              Total:{" "}
              {rupiah(
                item.sale_price ||
                  item.items?.price_idr * (item.quantity || 1) ||
                  0
              )}
            </Text>
            <Text style={styles.date}>
              {new Date(item.created_at).toLocaleTimeString("id-ID")}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
  },
  name: { fontSize: 18, fontWeight: "500" },
  qty: { fontSize: 16, color: "#555" },
  date: { fontSize: 13, color: "#888", marginTop: 4 },
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
  recentCard: {
    backgroundColor: "#e8f4ff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: 6,
  },
});
