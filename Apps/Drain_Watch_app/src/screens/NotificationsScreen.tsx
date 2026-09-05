import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { MainTabScreenProps } from '../navigation/types';

const ALERTS = [
  { id: 'ALT-91', type: 'Critical Surcharges', title: 'Storm drain surcharge predicted', zone: 'Rail Underpass B4', time: '09:42', unread: true },
  { id: 'ALT-87', type: 'Advisories', title: 'School zone diversion advisory', zone: 'Civic Ward A1', time: '09:18', unread: true },
  { id: 'ALT-72', type: 'Critical Surcharges', title: 'Pump station load above threshold', zone: 'Market Basin C2', time: '08:55', unread: false },
  { id: 'ALT-63', type: 'Advisories', title: 'Public bulletin: avoid low-lying service road', zone: 'North Link D6', time: '08:30', unread: false },
] as const;

const FILTERS = ['All Feeds', 'Critical Surcharges', 'Advisories'] as const;

export default function NotificationsScreen({ navigation }: MainTabScreenProps<'NotificationsTab'>) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All Feeds');

  const filteredAlerts = useMemo(
    () => ALERTS.filter((alert) => filter === 'All Feeds' || alert.type === filter),
    [filter],
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 8 }]}>
        <View>
          <Text style={styles.title}>System Alerts</Text>
          <Text style={styles.subtitle}>Weather advisories and municipal bulletins</Text>
        </View>
        <View style={styles.unreadBubble}>
          <Text style={styles.unreadText}>2</Text>
        </View>
      </View>

      <View style={styles.segmented}>
        {FILTERS.map((item) => {
          const active = item === filter;
          return (
            <TouchableOpacity key={item} style={[styles.segment, active && styles.segmentActive]} onPress={() => setFilter(item)}>
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{item}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filteredAlerts.map((alert) => {
          const critical = alert.type === 'Critical Surcharges';
          return (
            <View key={alert.id} style={styles.alertCard}>
              <View style={[styles.alertIcon, critical ? styles.criticalIcon : styles.advisoryIcon]}>
                <Ionicons name={critical ? 'flash-outline' : 'information-circle-outline'} size={22} color={critical ? '#BE123C' : '#0E7490'} />
              </View>
              <View style={styles.alertBody}>
                <View style={styles.alertTopline}>
                  <Text style={styles.alertType}>{alert.type}</Text>
                  {alert.unread ? <View style={styles.unreadDot} /> : null}
                </View>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertMeta}>{alert.time} · {alert.zone}</Text>
                <TouchableOpacity style={styles.deployButton} onPress={() => navigation.navigate('HomeTab')}>
                  <Ionicons name="map-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.deployText}>Deploy Route Mitigation</Text>
                </TouchableOpacity>
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
  header: { paddingHorizontal: 18, paddingBottom: 14, backgroundColor: '#F4F8F7', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 27, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 3 },
  unreadBubble: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#BE123C', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 18px rgba(190,18,60,0.22)' },
  unreadText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  segmented: { marginHorizontal: 18, borderRadius: 22, backgroundColor: '#E2E8F0', padding: 4, flexDirection: 'row', gap: 4 },
  segment: { flex: 1, minHeight: 38, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  segmentActive: { backgroundColor: '#FFFFFF', boxShadow: '0 4px 12px rgba(15,23,42,0.08)' },
  segmentText: { fontSize: 11, color: '#64748B', fontWeight: '900', textAlign: 'center' },
  segmentTextActive: { color: '#0F172A' },
  list: { padding: 18, paddingBottom: 34, gap: 12 },
  alertCard: { flexDirection: 'row', gap: 13, borderRadius: 20, backgroundColor: '#F8FAFC', padding: 15, borderWidth: 1, borderColor: '#E2E8F0', boxShadow: 'inset -4px -4px 9px rgba(255,255,255,0.96), inset 4px 4px 9px rgba(148,163,184,0.24), 0 8px 18px rgba(15,23,42,0.06)' },
  alertIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  criticalIcon: { backgroundColor: '#FFE4E6' },
  advisoryIcon: { backgroundColor: '#CFFAFE' },
  alertBody: { flex: 1, gap: 6 },
  alertTopline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  alertType: { fontSize: 11, color: '#0E7490', fontWeight: '900', textTransform: 'uppercase' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#BE123C' },
  alertTitle: { fontSize: 16, lineHeight: 21, color: '#0F172A', fontWeight: '900' },
  alertMeta: { fontSize: 12, color: '#64748B', fontWeight: '700' },
  deployButton: { alignSelf: 'flex-start', marginTop: 6, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: '#0F766E', flexDirection: 'row', alignItems: 'center', gap: 7 },
  deployText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
});
