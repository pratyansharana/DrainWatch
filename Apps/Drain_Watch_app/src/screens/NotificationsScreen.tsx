import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { MainTabScreenProps } from '../navigation/types';
import { fetchFloodPredictions, FloodPredictionResponse } from '../../services/drainApi';

interface DynamicAlert {
  id: string;
  type: 'Critical Surcharges' | 'Advisories';
  title: string;
  zone: string;
  depth: number;
  time: string;
  unread: boolean;
}

const FILTERS = ['All Feeds', 'Critical Surcharges', 'Advisories'] as const;

export default function NotificationsScreen({ navigation }: MainTabScreenProps<'NotificationsTab'>) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All Feeds');
  const [loading, setLoading] = useState(false);
  const [floodData, setFloodData] = useState<FloodPredictionResponse | null>(null);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchFloodPredictions(60.0, 15.0);
      setFloodData(res);
    } catch (e) {
      console.error('[NotificationsScreen] Error loading alerts:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Transform live backend landmark hazards into dynamic municipal alerts
  const alerts: DynamicAlert[] = useMemo(() => {
    if (!floodData || !floodData.landmarks) return [];

    const generated: DynamicAlert[] = [];
    let idx = 101;

    // Check active blockages first
    if (floodData.active_blockages) {
      Object.entries(floodData.active_blockages).forEach(([loc, ratio]) => {
        generated.push({
          id: `BLK-${idx++}`,
          type: 'Critical Surcharges',
          title: `Reported Drain Blockage: ${Math.round(ratio * 100)}% capacity reduction`,
          zone: loc,
          depth: 25.0,
          time: 'Just now',
          unread: true,
        });
      });
    }

    // Process landmark predictions
    floodData.landmarks.forEach((item) => {
      if (item.predicted_depth_cm >= 15.0 || item.risk_level === 'CRITICAL') {
        generated.push({
          id: `ALT-${idx++}`,
          type: 'Critical Surcharges',
          title: `Severe Waterlogging: ${item.predicted_depth_cm.toFixed(1)} cm projected depth`,
          zone: item.landmark,
          depth: item.predicted_depth_cm,
          time: `${item.time_to_flood_min}m window`,
          unread: true,
        });
      } else if (item.predicted_depth_cm >= 8.0 || item.risk_level === 'HIGH' || item.risk_level === 'MEDIUM') {
        generated.push({
          id: `ADV-${idx++}`,
          type: 'Advisories',
          title: `Surface Runoff Advisory (${item.predicted_depth_cm.toFixed(1)} cm depth)`,
          zone: item.landmark,
          depth: item.predicted_depth_cm,
          time: `${item.time_to_flood_min}m window`,
          unread: false,
        });
      }
    });

    return generated;
  }, [floodData]);

  const filteredAlerts = useMemo(
    () => alerts.filter((alert) => filter === 'All Feeds' || alert.type === filter),
    [alerts, filter]
  );

  const unreadCount = useMemo(() => alerts.filter((a) => a.unread).length, [alerts]);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 8 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>System Alerts</Text>
          <Text style={styles.subtitle}>
            {floodData?.isFallback
              ? 'Telemetry cache · Pull to refresh'
              : 'Live telemetry from FastAPI Surrogate Predictor'}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshIconBtn} onPress={loadAlerts} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#0E7490" />
          ) : (
            <Ionicons name="refresh" size={20} color="#0E7490" />
          )}
        </TouchableOpacity>
        {unreadCount > 0 && (
          <View style={styles.unreadBubble}>
            <Text style={styles.unreadText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      <View style={styles.segmented}>
        {FILTERS.map((item) => {
          const active = item === filter;
          return (
            <TouchableOpacity
              key={item}
              style={[styles.segment, active && styles.segmentActive]}
              onPress={() => setFilter(item)}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{item}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {filteredAlerts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-circle-outline" size={44} color="#10B981" />
            <Text style={styles.emptyTitle}>Corridor Clear</Text>
            <Text style={styles.emptySub}>No active flood surcharges or blockage advisories.</Text>
          </View>
        ) : (
          filteredAlerts.map((alert) => {
            const critical = alert.type === 'Critical Surcharges';
            return (
              <View key={alert.id} style={styles.alertCard}>
                <View style={[styles.alertIcon, critical ? styles.criticalIcon : styles.advisoryIcon]}>
                  <Ionicons
                    name={critical ? 'flash-outline' : 'information-circle-outline'}
                    size={22}
                    color={critical ? '#BE123C' : '#0E7490'}
                  />
                </View>
                <View style={styles.alertBody}>
                  <View style={styles.alertTopline}>
                    <Text style={[styles.alertType, { color: critical ? '#BE123C' : '#0E7490' }]}>
                      {alert.type}
                    </Text>
                    {alert.unread ? <View style={styles.unreadDot} /> : null}
                  </View>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertMeta}>
                    {alert.time} · {alert.zone}
                  </Text>
                  <TouchableOpacity
                    style={styles.deployButton}
                    onPress={() => navigation.navigate('ExploreTab')}
                  >
                    <Ionicons name="navigate-outline" size={15} color="#FFFFFF" />
                    <Text style={styles.deployText}>View Safe Reroute</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F8F7' },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    backgroundColor: '#F4F8F7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: { fontSize: 26, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  refreshIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#BE123C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  segmented: {
    marginHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    padding: 4,
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    flex: 1,
    minHeight: 36,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  segmentActive: { backgroundColor: '#FFFFFF' },
  segmentText: { fontSize: 11, color: '#64748B', fontWeight: '800', textAlign: 'center' },
  segmentTextActive: { color: '#0F172A' },
  list: { padding: 18, paddingBottom: 34, gap: 12 },
  alertCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  alertIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  criticalIcon: { backgroundColor: '#FFE4E6' },
  advisoryIcon: { backgroundColor: '#CFFAFE' },
  alertBody: { flex: 1, gap: 4 },
  alertTopline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  alertType: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#BE123C' },
  alertTitle: { fontSize: 15, lineHeight: 20, color: '#0F172A', fontWeight: '800' },
  alertMeta: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  deployButton: {
    alignSelf: 'flex-start',
    marginTop: 6,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#0F766E',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deployText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  emptySub: { fontSize: 12, color: '#64748B', textAlign: 'center' },
});
