import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import { supabase } from "././lib/supabaseClient";

export default function DailyReportScreen() {
  const [data, setData] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReport = async () => {
    setRefreshing(true);
    const { data, error } = await supabase
      .from("daily_sales")
      .select("*, items(name)")
      .eq("date", new Date().toISOString().split("T")[0])
      .order("total_sold", { ascending: false });

    if (error) console.error(error);
    else setData(data || []);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Daily Sales Report</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchReport} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.items.name}</Text>
            <Text style={styles.qty}>Sold: {Math.floor(item.total_sold)}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
  },
  name: { fontSize: 18, fontWeight: "500" },
  qty: { fontSize: 16, color: "#555" },
});
