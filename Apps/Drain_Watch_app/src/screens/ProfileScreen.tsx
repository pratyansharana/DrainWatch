import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const INCIDENTS = [
  { id: 'INC-8042', zone: 'Rail Underpass B4', depth: 42, status: 'Pending Verification', time: '4 min ago' },
  { id: 'INC-8038', zone: 'Market Basin C2', depth: 24, status: 'Pending Verification', time: '18 min ago' },
  { id: 'INC-8019', zone: 'North Link D6', depth: 9, status: 'Resolved', time: '1 hr ago' },
] as const;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [depth, setDepth] = useState(45);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top, 16) + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.kicker}>Field Telemetry</Text>
            <Text style={styles.title}>Incident Logging</Text>
          </View>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryMetric}>
              <Text style={styles.metricValue}>128</Text>
              <Text style={styles.metricLabel}>Active nodes</Text>
            </View>
            <View style={styles.summaryMetric}>
              <Text style={styles.metricValue}>2.4k</Text>
              <Text style={styles.metricLabel}>Verifications</Text>
            </View>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Log Infrastructure Anomaly</Text>
          <View style={styles.pinSelector}>
            <Ionicons name="location" size={22} color="#E11D48" />
            <View style={{ flex: 1 }}>
              <Text style={styles.pinTitle}>Map Pin Selector</Text>
              <Text style={styles.pinSub}>19.0760, 72.8777 · auto geofence Ward 12</Text>
            </View>
            <TouchableOpacity style={styles.pinButton}>
              <Text style={styles.pinButtonText}>Set</Text>
            </TouchableOpacity>
          </View>

          <TextInput style={styles.textArea} multiline placeholder="Describe blocked drain, overflow point, road cave-in..." placeholderTextColor="#94A3B8" />

          <View style={styles.depthHeader}>
            <Text style={styles.sectionTitle}>Observed Water Depth</Text>
            <Text style={styles.depthValue}>{depth} cm</Text>
          </View>
          <View style={styles.depthSlider}>
            <View style={[styles.depthFill, { width: `${depth}%` }]} />
            {[0, 25, 50, 75, 100].map((value) => (
              <TouchableOpacity key={value} style={styles.depthHit} onPress={() => setDepth(value)}>
                <View style={[styles.depthTick, depth === value && styles.depthTickActive]} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.uploadBox}>
            <Ionicons name="cloud-upload-outline" size={26} color="#0E7490" />
            <View>
              <Text style={styles.uploadTitle}>Attach geo-tagged field photos</Text>
              <Text style={styles.uploadSub}>JPG, PNG · EXIF location retained</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.streamHeader}>
          <Text style={styles.titleSmall}>Recent Reports</Text>
          <Text style={styles.streamSub}>Firestore sync queue</Text>
        </View>
        {INCIDENTS.map((incident) => {
          const resolved = incident.status === 'Resolved';
          return (
            <View key={incident.id} style={styles.incidentCard}>
              <View style={styles.incidentIcon}>
                <Ionicons name={resolved ? 'checkmark-done-outline' : 'git-pull-request-outline'} size={20} color={resolved ? '#047857' : '#B45309'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.incidentTitle}>{incident.zone}</Text>
                <Text style={styles.incidentMeta}>{incident.id} · {incident.depth} cm · {incident.time}</Text>
              </View>
              <View style={[styles.badge, resolved ? styles.badgeResolved : styles.badgePending]}>
                <Text style={[styles.badgeText, resolved ? styles.badgeTextResolved : styles.badgeTextPending]}>{incident.status}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F8F7' },
  container: { paddingHorizontal: 18, paddingBottom: 34, gap: 16 },
  summaryCard: { borderRadius: 22, padding: 18, backgroundColor: '#0F172A', gap: 18, boxShadow: '0 14px 30px rgba(15,23,42,0.2)' },
  kicker: { fontSize: 12, color: '#67E8F9', fontWeight: '900', textTransform: 'uppercase' },
  title: { fontSize: 27, color: '#FFFFFF', fontWeight: '900', marginTop: 4 },
  summaryGrid: { flexDirection: 'row', gap: 12 },
  summaryMetric: { flex: 1, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', padding: 14 },
  metricValue: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] },
  metricLabel: { color: '#CBD5E1', fontSize: 12, marginTop: 3 },
  formCard: { borderRadius: 22, backgroundColor: '#FFFFFF', padding: 16, gap: 14, borderWidth: 1, borderColor: '#E2E8F0', boxShadow: '0 8px 22px rgba(15,23,42,0.07)' },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
  pinSelector: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: 16, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  pinTitle: { fontSize: 14, color: '#0F172A', fontWeight: '800' },
  pinSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  pinButton: { borderRadius: 14, backgroundColor: '#E0F2FE', paddingHorizontal: 12, paddingVertical: 7 },
  pinButtonText: { color: '#075985', fontWeight: '900', fontSize: 12 },
  textArea: { minHeight: 92, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', padding: 14, color: '#0F172A', textAlignVertical: 'top' },
  depthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  depthValue: { fontSize: 14, fontWeight: '900', color: '#0E7490' },
  depthSlider: { height: 24, borderRadius: 12, flexDirection: 'row', backgroundColor: '#E2E8F0', overflow: 'hidden' },
  depthFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#22D3EE' },
  depthHit: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  depthTick: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#FFFFFF' },
  depthTickActive: { width: 15, height: 15, borderRadius: 8, backgroundColor: '#0F172A' },
  uploadBox: { borderWidth: 1, borderStyle: 'dashed', borderColor: '#67E8F9', backgroundColor: '#ECFEFF', borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  uploadTitle: { color: '#0F172A', fontSize: 14, fontWeight: '800' },
  uploadSub: { color: '#64748B', fontSize: 12, marginTop: 2 },
  streamHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 },
  titleSmall: { fontSize: 19, fontWeight: '900', color: '#0F172A' },
  streamSub: { fontSize: 12, fontWeight: '800', color: '#64748B' },
  incidentCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, backgroundColor: '#FFFFFF', padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  incidentIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  incidentTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
  incidentMeta: { fontSize: 12, color: '#64748B', marginTop: 3 },
  badge: { maxWidth: 108, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 6 },
  badgePending: { backgroundColor: '#FEF3C7' },
  badgeResolved: { backgroundColor: '#D1FAE5' },
  badgeText: { fontSize: 10, fontWeight: '900', textAlign: 'center' },
  badgeTextPending: { color: '#92400E' },
  badgeTextResolved: { color: '#047857' },
});
