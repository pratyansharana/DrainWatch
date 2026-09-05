import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Circle, Marker, type Region } from 'react-native-maps';
import type { MainTabScreenProps } from '../navigation/types';

const ZONES = [
  { id: 'ND', name: 'North Delhi', depth: 18, risk: 'Watch', color: '#F4C95D', coordinate: { latitude: 28.7041, longitude: 77.1025 }, radius: 2600 },
  { id: 'ED', name: 'Yamuna Bank', depth: 46, risk: 'Critical', color: '#F05D5E', coordinate: { latitude: 28.6506, longitude: 77.2392 }, radius: 4200 },
  { id: 'CD', name: 'Central Delhi', depth: 31, risk: 'Rising', color: '#F59E0B', coordinate: { latitude: 28.6328, longitude: 77.2197 }, radius: 3400 },
  { id: 'SD', name: 'South Delhi', depth: 12, risk: 'Stable', color: '#52B788', coordinate: { latitude: 28.5355, longitude: 77.2410 }, radius: 3900 },
] as const;

const RAIN_SERIES = [12, 18, 31, 46, 39, 28, 22, 17];
const DELHI_REGION: Region = {
  latitude: 28.6139,
  longitude: 77.2090,
  latitudeDelta: 0.23,
  longitudeDelta: 0.18,
};

export default function HomeScreen({ navigation }: MainTabScreenProps<'HomeTab'>) {
  const insets = useSafeAreaInsets();
  const [hour, setHour] = useState(1.5);
  const [region, setRegion] = useState<Region>(DELHI_REGION);
  const selected = useMemo(() => ZONES.find((zone) => zone.depth > 35) ?? ZONES[0], []);

  const zoom = (factor: number) => {
    setRegion((current) => ({
      ...current,
      latitudeDelta: Math.max(0.018, Math.min(0.45, current.latitudeDelta * factor)),
      longitudeDelta: Math.max(0.014, Math.min(0.35, current.longitudeDelta * factor)),
    }));
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { top: Math.max(insets.top, 14) }]}>
        <View style={styles.brandMark}>
          <Ionicons name="water" size={18} color="#083344" />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.brand}>DrainWatch Command</Text>
          <View style={styles.statusRow}>
            <View style={styles.liveDot} />
            <Text style={styles.statusText}>Telemetry Active</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.trayButton} onPress={() => navigation.navigate('NotificationsTab')}>
          <Ionicons name="notifications-outline" size={20} color="#0F172A" />
          <View style={styles.trayBadge} />
        </TouchableOpacity>
      </View>

      <View style={styles.mapCanvas}>
        <MapView
          style={StyleSheet.absoluteFill}
          region={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation
          showsCompass
          showsScale
          rotateEnabled={false}
          pitchEnabled={false}
          zoomEnabled
          scrollEnabled
        >
          {ZONES.map((zone) => (
            <Circle
              key={`${zone.id}-heat`}
              center={zone.coordinate}
              radius={zone.radius}
              fillColor={`${zone.color}88`}
              strokeColor={zone.color}
              strokeWidth={2}
            />
          ))}
          {ZONES.map((zone) => (
            <Marker key={zone.id} coordinate={zone.coordinate} title={zone.name} description={`${zone.depth} cm · ${zone.risk}`}>
              <View style={styles.mapMarker}>
                <Text style={styles.zoneId}>{zone.id}</Text>
                <Text style={styles.zoneDepth}>{zone.depth} cm</Text>
              </View>
            </Marker>
          ))}
        </MapView>
        <View style={styles.mapLabel}>
          <Ionicons name="map-outline" size={15} color="#0F766E" />
          <Text style={styles.mapLabelText}>Live Delhi heatmap</Text>
        </View>
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.zoomButton} onPress={() => zoom(0.62)}>
            <Ionicons name="add" size={22} color="#0F172A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomButton} onPress={() => zoom(1.38)}>
            <Ionicons name="remove" size={22} color="#0F172A" />
          </TouchableOpacity>
        </View>
        <View style={styles.radarSweep} />
      </View>

      <View style={[styles.telemetryCard, { bottom: 18 + insets.bottom }]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>0-3 Hour Rain Telemetry</Text>
            <Text style={styles.cardSub}>WAPI radar + MI surface flood model, refresh 5 min</Text>
          </View>
          <View style={styles.depthPill}>
            <Text style={styles.depthPillText}>{selected.risk}</Text>
          </View>
        </View>

        <View style={styles.sliderTrack}>
          <View style={[styles.sliderFill, { width: `${(hour / 3) * 100}%` }]} />
          {[0, 1, 2, 3].map((value) => (
            <TouchableOpacity key={value} style={styles.sliderHit} onPress={() => setHour(value)}>
              <View style={[styles.sliderTick, Math.round(hour) === value && styles.sliderTickActive]} />
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.sliderLabels}>
          <Text style={styles.miniLabel}>Now</Text>
          <Text style={styles.miniLabel}>+{hour.toFixed(1)}h forecast</Text>
          <Text style={styles.miniLabel}>+3h</Text>
        </View>

        <View style={styles.chartRow}>
          {RAIN_SERIES.map((value, index) => (
            <View key={`${value}-${index}`} style={styles.chartColumn}>
              <View style={[styles.chartBar, { height: 24 + value }]} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#DDEBE8' },
  header: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 3,
    minHeight: 62,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    boxShadow: '0 10px 28px rgba(15, 23, 42, 0.12)',
  },
  brandMark: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#CFFAFE', alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  brand: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  statusText: { fontSize: 12, color: '#475569', fontWeight: '700' },
  trayButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  trayBadge: { position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#E11D48' },
  mapCanvas: { flex: 1, backgroundColor: '#DDEBE8', overflow: 'hidden' },
  mapMarker: { minWidth: 68, borderRadius: 16, borderCurve: 'continuous', borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', padding: 8, backgroundColor: 'rgba(255,255,255,0.86)', alignItems: 'center', boxShadow: '0 5px 12px rgba(15,23,42,0.18)' },
  zoneId: { fontSize: 12, fontWeight: '900', color: '#0F172A' },
  zoneDepth: { fontSize: 13, color: '#0F172A', fontWeight: '900', fontVariant: ['tabular-nums'] },
  mapLabel: { position: 'absolute', left: 18, top: 98, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 11, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  mapLabelText: { fontSize: 12, color: '#0F172A', fontWeight: '900' },
  zoomControls: { position: 'absolute', right: 16, top: 96, gap: 8 },
  zoomButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 18px rgba(15,23,42,0.14)' },
  radarSweep: { position: 'absolute', width: 190, height: 190, borderRadius: 95, top: '34%', left: '27%', borderWidth: 1, borderColor: 'rgba(14, 165, 233, 0.35)', backgroundColor: 'rgba(14, 165, 233, 0.08)' },
  telemetryCard: { position: 'absolute', left: 16, right: 16, borderRadius: 26, borderCurve: 'continuous', padding: 18, backgroundColor: '#EEF5F3', boxShadow: 'inset 4px 4px 10px rgba(148, 163, 184, 0.45), inset -5px -5px 12px rgba(255,255,255,0.95), 0 18px 40px rgba(15,23,42,0.16)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' },
  cardTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  cardSub: { fontSize: 12, color: '#64748B', marginTop: 3, maxWidth: 230 },
  depthPill: { borderRadius: 18, backgroundColor: '#FFE4E6', paddingHorizontal: 10, paddingVertical: 6 },
  depthPillText: { color: '#BE123C', fontSize: 11, fontWeight: '900' },
  sliderTrack: { marginTop: 18, height: 22, borderRadius: 11, backgroundColor: '#D8E6E2', flexDirection: 'row', overflow: 'hidden' },
  sliderFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#0891B2' },
  sliderHit: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sliderTick: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFFFFF' },
  sliderTickActive: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#0F172A' },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
  miniLabel: { fontSize: 11, color: '#64748B', fontWeight: '700' },
  chartRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', height: 82, marginTop: 12 },
  chartColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  chartBar: { width: '100%', borderRadius: 8, backgroundColor: '#0E7490' },
});
