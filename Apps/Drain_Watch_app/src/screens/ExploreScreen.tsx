import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Circle, Marker, Polyline, type Region } from 'react-native-maps';

const VEHICLES = [
  { id: 'Two-Wheeler', icon: 'bicycle-outline', clearance: 12 },
  { id: 'Sedan', icon: 'car-sport-outline', clearance: 16 },
  { id: 'SUV', icon: 'car-outline', clearance: 24 },
  { id: 'Heavy Transport', icon: 'bus-outline', clearance: 38 },
] as const;

const DELHI_ROUTE_REGION: Region = {
  latitude: 28.6139,
  longitude: 77.2090,
  latitudeDelta: 0.25,
  longitudeDelta: 0.18,
};

const SAFE_ROUTE = [
  { latitude: 28.5355, longitude: 77.1855 },
  { latitude: 28.5672, longitude: 77.1944 },
  { latitude: 28.5907, longitude: 77.2129 },
  { latitude: 28.6269, longitude: 77.2189 },
  { latitude: 28.6542, longitude: 77.2093 },
  { latitude: 28.7041, longitude: 77.1827 },
];

const FLOODED_ROUTE = [
  { latitude: 28.5355, longitude: 77.1855 },
  { latitude: 28.5748, longitude: 77.2261 },
  { latitude: 28.6139, longitude: 77.2365 },
  { latitude: 28.6506, longitude: 77.2392 },
  { latitude: 28.7041, longitude: 77.2323 },
];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [meshOnline, setMeshOnline] = useState(true);
  const [vehicle, setVehicle] = useState<(typeof VEHICLES)[number]['id']>('SUV');
  const [routeRegion, setRouteRegion] = useState<Region>(DELHI_ROUTE_REGION);

  const selectedVehicle = useMemo(() => VEHICLES.find((item) => item.id === vehicle) ?? VEHICLES[2], [vehicle]);
  const safeLatency = selectedVehicle.clearance > 20 ? '31 min' : '44 min';

  const zoomRoute = (factor: number) => {
    setRouteRegion((current) => ({
      ...current,
      latitudeDelta: Math.max(0.018, Math.min(0.46, current.latitudeDelta * factor)),
      longitudeDelta: Math.max(0.014, Math.min(0.34, current.longitudeDelta * factor)),
    }));
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top, 16) + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Vehicle Clearance Matrix</Text>
          <Text style={styles.subtitle}>OSMnx graph weights shift when flood thresholds exceed 15 cm.</Text>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputPill}>
            <Ionicons name="navigate-outline" size={18} color="#0891B2" />
            <TextInput style={styles.input} placeholder="Origin" placeholderTextColor="#94A3B8" defaultValue="Depot 7" />
          </View>
          <View style={styles.inputPill}>
            <Ionicons name="flag-outline" size={18} color="#0891B2" />
            <TextInput style={styles.input} placeholder="Destination" placeholderTextColor="#94A3B8" defaultValue="Ward 12 Pump House" />
          </View>
        </View>

        <View style={styles.meshRow}>
          <View>
            <Text style={styles.meshTitle}>Offline Mesh Status</Text>
            <Text style={styles.meshSub}>{meshOnline ? 'Local relays available for rerouting' : 'Cloud routing only'}</Text>
          </View>
          <Switch
            value={meshOnline}
            onValueChange={setMeshOnline}
            trackColor={{ false: '#CBD5E1', true: '#A7F3D0' }}
            thumbColor={meshOnline ? '#047857' : '#F8FAFC'}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vehicleToolbar}>
          {VEHICLES.map((item) => {
            const active = item.id === vehicle;
            return (
              <TouchableOpacity key={item.id} style={[styles.vehicleChip, active && styles.vehicleChipActive]} onPress={() => setVehicle(item.id)}>
                <Ionicons name={item.icon} size={18} color={active ? '#FFFFFF' : '#155E75'} />
                <Text style={[styles.vehicleText, active && styles.vehicleTextActive]}>{item.id}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.routeMapCard}>
          <View style={styles.mapHeader}>
            <View>
              <Text style={styles.mapTitle}>Delhi Routing Graph</Text>
              <Text style={styles.mapSub}>Safe corridor avoids Yamuna-bank flood edges above 15 cm.</Text>
            </View>
            <View style={styles.mapScale}>
              <Text style={styles.mapScaleText}>8.4 km</Text>
            </View>
          </View>
          <View style={styles.routeMapCanvas}>
            <MapView
              style={StyleSheet.absoluteFill}
              region={routeRegion}
              onRegionChangeComplete={setRouteRegion}
              showsCompass
              showsScale
              rotateEnabled={false}
              pitchEnabled={false}
              zoomEnabled
              scrollEnabled
            >
              <Circle
                center={{ latitude: 28.6506, longitude: 77.2392 }}
                radius={3900}
                fillColor="rgba(251, 113, 133, 0.3)"
                strokeColor="#E11D48"
                strokeWidth={1}
              />
              <Circle
                center={{ latitude: 28.6139, longitude: 77.2365 }}
                radius={2500}
                fillColor="rgba(245, 158, 11, 0.26)"
                strokeColor="#F59E0B"
                strokeWidth={1}
              />
              <Polyline coordinates={FLOODED_ROUTE} strokeColor="#E11D48" strokeWidth={6} lineDashPattern={[10, 8]} />
              <Polyline coordinates={SAFE_ROUTE} strokeColor="#059669" strokeWidth={7} />
              <Polyline coordinates={SAFE_ROUTE} strokeColor="#BBF7D0" strokeWidth={2} />
              <Marker coordinate={SAFE_ROUTE[0]} title="Origin" description="Depot 7" />
              <Marker coordinate={SAFE_ROUTE[SAFE_ROUTE.length - 1]} title="Destination" description="Ward 12 Pump House" />
              <Marker coordinate={{ latitude: 28.6506, longitude: 77.2392 }} title="Submerged Route" description="37 cm water depth" />
            </MapView>
            <View style={styles.routeZoomControls}>
              <TouchableOpacity style={styles.routeZoomButton} onPress={() => zoomRoute(0.62)}>
                <Ionicons name="add" size={20} color="#0F172A" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.routeZoomButton} onPress={() => zoomRoute(1.38)}>
                <Ionicons name="remove" size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, styles.safeLegend]} />
              <Text style={styles.legendText}>Primary safe route</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, styles.blockedLegend]} />
              <Text style={styles.legendText}>Submerged route</Text>
            </View>
          </View>
        </View>

        <View style={styles.matrix}>
          <View style={[styles.routeCard, styles.safeCard]}>
            <View style={styles.routeHeader}>
              <Ionicons name="shield-checkmark" size={24} color="#047857" />
              <Text style={styles.routeBadge}>Recommended</Text>
            </View>
            <Text style={styles.routeTitle}>Primary Safe Corridor</Text>
            <Text style={styles.routeMeta}>{safeLatency} latency · max depth 11 cm · 8.4 km</Text>
            <View style={styles.routePath}>
              <View style={styles.routeDot} />
              <View style={styles.routeLine} />
              <View style={styles.routeDot} />
              <View style={styles.routeLine} />
              <View style={styles.routeDot} />
            </View>
            <Text style={styles.routeNote}>Clear for {vehicle} with {selectedVehicle.clearance} cm clearance.</Text>
          </View>

          <View style={[styles.routeCard, styles.blockedCard]}>
            <View style={styles.routeHeader}>
              <Ionicons name="warning" size={24} color="#DC2626" />
              <Text style={[styles.routeBadge, styles.dangerBadge]}>Suppressed</Text>
            </View>
            <Text style={styles.routeTitle}>Submerged Route</Text>
            <Text style={styles.routeMeta}>18 min latency · max depth 37 cm · 5.2 km</Text>
            <View style={styles.depthStrip}>
              {[12, 18, 31, 37, 22].map((depth) => (
                <View key={depth} style={[styles.depthBlock, depth > 15 && styles.depthBlockDanger]}>
                  <Text style={styles.depthText}>{depth}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.routeNote}>Excluded because edge depth exceeds safe flood vector.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F8F7' },
  container: { paddingHorizontal: 18, paddingBottom: 34, gap: 18 },
  header: { gap: 5 },
  title: { fontSize: 26, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 13, color: '#64748B', lineHeight: 19 },
  inputRow: { gap: 10 },
  inputPill: { height: 52, borderRadius: 26, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDE8E6', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10, boxShadow: '0 4px 12px rgba(15,23,42,0.06)' },
  input: { flex: 1, fontSize: 15, color: '#0F172A', fontWeight: '700' },
  meshRow: { borderRadius: 18, backgroundColor: '#E8F3F0', padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  meshTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  meshSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  vehicleToolbar: { gap: 10, paddingVertical: 2 },
  vehicleChip: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 22, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#E0F2FE', borderWidth: 1, borderColor: '#BAE6FD', boxShadow: 'inset 2px 2px 4px rgba(14,116,144,0.12), inset -2px -2px 4px rgba(255,255,255,0.9)' },
  vehicleChipActive: { backgroundColor: '#155E75', borderColor: '#155E75', boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.28)' },
  vehicleText: { fontSize: 12, fontWeight: '900', color: '#155E75' },
  vehicleTextActive: { color: '#FFFFFF' },
  routeMapCard: { borderRadius: 22, padding: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDE8E6', boxShadow: '0 10px 24px rgba(15,23,42,0.08)' },
  mapHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  mapTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  mapSub: { fontSize: 12, lineHeight: 17, color: '#64748B', marginTop: 3, maxWidth: 235 },
  mapScale: { borderRadius: 15, backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 6 },
  mapScaleText: { fontSize: 11, fontWeight: '900', color: '#047857' },
  routeMapCanvas: { height: 320, borderRadius: 18, backgroundColor: '#F1F8F6', overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  routeZoomControls: { position: 'absolute', right: 10, top: 10, gap: 8 },
  routeZoomButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center', boxShadow: '0 7px 14px rgba(15,23,42,0.14)' },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendLine: { width: 24, height: 5, borderRadius: 3 },
  safeLegend: { backgroundColor: '#059669' },
  blockedLegend: { backgroundColor: '#E11D48' },
  legendText: { fontSize: 12, color: '#475569', fontWeight: '800' },
  matrix: { flexDirection: 'row', gap: 12 },
  routeCard: { flex: 1, minHeight: 250, borderRadius: 18, padding: 15, borderWidth: 1, boxShadow: '0 10px 24px rgba(15,23,42,0.08)' },
  safeCard: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  blockedCard: { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' },
  routeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  routeBadge: { fontSize: 10, fontWeight: '900', color: '#047857', backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12 },
  dangerBadge: { color: '#B91C1C', backgroundColor: '#FEE2E2' },
  routeTitle: { fontSize: 17, fontWeight: '900', color: '#0F172A', marginBottom: 8 },
  routeMeta: { fontSize: 12, lineHeight: 17, color: '#475569', fontWeight: '700' },
  routePath: { flexDirection: 'row', alignItems: 'center', marginVertical: 22 },
  routeDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#047857' },
  routeLine: { flex: 1, height: 4, backgroundColor: '#86EFAC' },
  routeNote: { fontSize: 12, color: '#334155', lineHeight: 17 },
  depthStrip: { flexDirection: 'row', gap: 5, marginVertical: 22 },
  depthBlock: { flex: 1, height: 44, borderRadius: 10, backgroundColor: '#BAE6FD', alignItems: 'center', justifyContent: 'center' },
  depthBlockDanger: { backgroundColor: '#FB7185' },
  depthText: { fontSize: 11, color: '#0F172A', fontWeight: '900' },
});
