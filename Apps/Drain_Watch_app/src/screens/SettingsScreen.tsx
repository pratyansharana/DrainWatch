import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const DISPATCH_LINKS = [
  { label: 'Disaster Cell', icon: 'megaphone-outline', detail: 'Ward command bridge' },
  { label: 'Traffic Control', icon: 'trail-sign-outline', detail: 'Signal and barricade unit' },
  { label: 'Medical Services', icon: 'medkit-outline', detail: 'Ambulance priority lane' },
  { label: 'Pump Operations', icon: 'construct-outline', detail: 'Drainage crew dispatch' },
] as const;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [armed, setArmed] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startHold = () => {
    holdTimer.current = setTimeout(() => setArmed(true), 2000);
  };

  const cancelHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top, 16) + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Emergency Dispatch</Text>
          <Text style={styles.subtitle}>Encrypted municipal response coordination.</Text>
        </View>

        <View style={styles.sosPanel}>
          <Pressable
            onPressIn={startHold}
            onPressOut={cancelHold}
            style={({ pressed }) => [styles.sosButton, pressed && styles.sosButtonPressed, armed && styles.sosButtonArmed]}
          >
            <Ionicons name={armed ? 'radio' : 'finger-print-outline'} size={42} color="#FFFFFF" />
            <Text style={styles.sosTitle}>{armed ? 'Emergency Broadcast Armed' : 'Initiate Protocol'}</Text>
            <Text style={styles.sosSub}>Emergency Broadcast · 2 sec long-press</Text>
          </Pressable>
        </View>

        <View style={styles.grid}>
          {DISPATCH_LINKS.map((item) => (
            <TouchableOpacity key={item.label} style={styles.actionCard}>
              <View style={styles.actionIcon}>
                <Ionicons name={item.icon} size={23} color="#0F766E" />
              </View>
              <Text style={styles.actionTitle}>{item.label}</Text>
              <Text style={styles.actionDetail}>{item.detail}</Text>
              <Text style={styles.actionLink}>Encrypted dial</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.diagnosticFooter}>
          <Text selectable style={styles.diagText}>GPS 19.0760, 72.8777</Text>
          <Text selectable style={styles.diagText}>Battery 82%</Text>
          <Text selectable style={styles.diagText}>Ping 38 ms stable</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7FAF9' },
  container: { paddingHorizontal: 18, paddingBottom: 34, gap: 22, justifyContent: 'center', flexGrow: 1 },
  header: { alignItems: 'center', gap: 5 },
  title: { fontSize: 27, fontWeight: '900', color: '#0F172A', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#64748B', textAlign: 'center' },
  sosPanel: { alignItems: 'center', paddingVertical: 8 },
  sosButton: { width: 250, height: 250, borderRadius: 125, backgroundColor: '#BE123C', alignItems: 'center', justifyContent: 'center', padding: 24, boxShadow: 'inset 8px 8px 18px rgba(76,5,25,0.5), inset -8px -8px 18px rgba(255,160,160,0.28), 0 18px 40px rgba(190,18,60,0.32)' },
  sosButtonPressed: { transform: [{ scale: 0.98 }], backgroundColor: '#9F1239' },
  sosButtonArmed: { backgroundColor: '#7F1D1D' },
  sosTitle: { color: '#FFFFFF', fontSize: 21, fontWeight: '900', textAlign: 'center', marginTop: 14 },
  sosSub: { color: '#FFE4E6', fontSize: 12, fontWeight: '800', textAlign: 'center', marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: { width: '48%', minHeight: 150, borderRadius: 18, backgroundColor: '#FFFFFF', padding: 15, borderWidth: 1, borderColor: '#E2E8F0', boxShadow: '0 8px 20px rgba(15,23,42,0.07)' },
  actionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#CCFBF1', marginBottom: 12 },
  actionTitle: { fontSize: 15, color: '#0F172A', fontWeight: '900' },
  actionDetail: { fontSize: 12, color: '#64748B', lineHeight: 17, marginTop: 4 },
  actionLink: { fontSize: 11, color: '#0F766E', fontWeight: '900', marginTop: 12 },
  diagnosticFooter: { borderRadius: 18, padding: 14, backgroundColor: '#0F172A', flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  diagText: { color: '#BAE6FD', fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
