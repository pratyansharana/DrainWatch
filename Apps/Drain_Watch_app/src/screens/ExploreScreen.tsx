import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';
import {
  fetchSafeRoute,
  fetchRoadGeometry,
  CORRIDOR_LANDMARKS,
  SafeRouteResponse,
} from '../../services/drainApi';

const VEHICLES = [
  { id: 'Two-Wheeler', icon: 'bicycle-outline', clearance: 12 },
  { id: 'Sedan', icon: 'car-sport-outline', clearance: 16 },
  { id: 'SUV', icon: 'car-outline', clearance: 24 },
  { id: 'Heavy Transport', icon: 'bus-outline', clearance: 38 },
] as const;

const AVAILABLE_NODES = Object.keys(CORRIDOR_LANDMARKS);

const DELHI_ROUTE_REGION: Region = {
  latitude: 28.6285,
  longitude: 77.2255,
  latitudeDelta: 0.024,
  longitudeDelta: 0.024,
};

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [origin, setOrigin] = useState<string>("Mandi House");
  const [destination, setDestination] = useState<string>("Rajiv Chowk Outer Circle");
  const [vehicle, setVehicle] = useState<(typeof VEHICLES)[number]['id']>('SUV');
  const [routeRegion, setRouteRegion] = useState<Region>(DELHI_ROUTE_REGION);
  const [loading, setLoading] = useState(false);
  const [routeData, setRouteData] = useState<SafeRouteResponse | null>(null);

  const selectedVehicle = useMemo(
    () => VEHICLES.find((item) => item.id === vehicle) ?? VEHICLES[2],
    [vehicle]
  );

  const loadRoute = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSafeRoute(origin, destination);
      setRouteData(res);
    } catch (e) {
      console.error('[ExploreScreen] Error loading route:', e);
    } finally {
      setLoading(false);
    }
  }, [origin, destination]);

  useEffect(() => {
    loadRoute();
  }, [loadRoute]);

  const [safeRoadCoords, setSafeRoadCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [naiveRoadCoords, setNaiveRoadCoords] = useState<{ latitude: number; longitude: number }[]>([]);

  useEffect(() => {
    async function resolveRealRoads() {
      if (routeData?.rl_safe_route) {
        const safe = await fetchRoadGeometry(routeData.rl_safe_route);
        setSafeRoadCoords(safe);
      } else {
        setSafeRoadCoords([]);
      }
      if (routeData?.naive_route) {
        const naive = await fetchRoadGeometry(routeData.naive_route);
        setNaiveRoadCoords(naive);
      } else {
        setNaiveRoadCoords([]);
      }
    }
    resolveRealRoads();
  }, [routeData]);

  const isClearForVehicle = (routeData?.rl_max_flood_depth_cm ?? 0) <= selectedVehicle.clearance;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top, 16) + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Q-Learning Safe Router</Text>
          <Text style={styles.subtitle}>
            Dynamic hydraulic edge weighting avoids street submergence &gt; 15 cm.
          </Text>
        </View>

        {/* Origin & Destination Selectors */}
        <View style={styles.inputRow}>
          <View style={styles.inputPill}>
            <Ionicons name="navigate-circle-outline" size={20} color="#0891B2" />
            <View style={{ flex: 1 }}>
              <Text style={styles.selectorLabel}>ORIGIN</Text>
              <Text style={styles.selectorValue}>{origin}</Text>
            </View>
          </View>
          <View style={styles.inputPill}>
            <Ionicons name="flag-outline" size={20} color="#0891B2" />
            <View style={{ flex: 1 }}>
              <Text style={styles.selectorLabel}>DESTINATION</Text>
              <Text style={styles.selectorValue}>{destination}</Text>
            </View>
            <TouchableOpacity style={styles.recalculateBtn} onPress={loadRoute} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="sparkles" size={16} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Vehicle Selection Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vehicleToolbar}>
          {VEHICLES.map((item) => {
            const active = item.id === vehicle;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.vehicleChip, active && styles.vehicleChipActive]}
                onPress={() => setVehicle(item.id)}
              >
                <Ionicons name={item.icon} size={18} color={active ? '#FFFFFF' : '#155E75'} />
                <Text style={[styles.vehicleText, active && styles.vehicleTextActive]}>
                  {item.id} ({item.clearance}cm)
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Interactive Map */}
        <View style={styles.routeMapCard}>
          <View style={styles.mapHeader}>
            <View>
              <Text style={styles.mapTitle}>Mandi House → Rajiv Chowk Corridor</Text>
              <Text style={styles.mapSub}>
                Green: Safe RL Route · Red dashed: Naive shortest path
              </Text>
            </View>
            <View style={styles.mapScale}>
              <Text style={styles.mapScaleText}>
                {routeData ? `${routeData.rl_travel_time_min} min` : 'Loading...'}
              </Text>
            </View>
          </View>

          <View style={styles.routeMapCanvas}>
            <MapView
              style={StyleSheet.absoluteFill}
              region={routeRegion}
              onRegionChangeComplete={setRouteRegion}
              showsCompass
              showsScale
            >
              {/* Naive Path (Red Dashed) */}
              {naiveRoadCoords.length > 1 && (
                <Polyline
                  coordinates={naiveRoadCoords}
                  strokeColor="#E11D48"
                  strokeWidth={5}
                  lineDashPattern={[8, 8]}
                />
              )}

              {/* RL Safe Path (Green Solid) */}
              {safeRoadCoords.length > 1 && (
                <Polyline
                  coordinates={safeRoadCoords}
                  strokeColor="#059669"
                  strokeWidth={6}
                />
              )}

              {/* Landmarks */}
              {AVAILABLE_NODES.map((name) => {
                const coord = CORRIDOR_LANDMARKS[name];
                const isOrigin = name === origin;
                const isDest = name === destination;
                return (
                  <Marker
                    key={name}
                    coordinate={{ latitude: coord.latitude, longitude: coord.longitude }}
                    title={name}
                    description={`Elevation: ${coord.elevation_m}m`}
                  >
                    <View
                      style={[
                        styles.markerPin,
                        isOrigin && styles.markerOrigin,
                        isDest && styles.markerDest,
                      ]}
                    >
                      <Ionicons
                        name={isOrigin ? 'pin' : isDest ? 'flag' : 'ellipse'}
                        size={isOrigin || isDest ? 14 : 8}
                        color="#FFFFFF"
                      />
                    </View>
                  </Marker>
                );
              })}
            </MapView>
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, styles.safeLegend]} />
              <Text style={styles.legendText}>Q-Learning Safe Path</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, styles.blockedLegend]} />
              <Text style={styles.legendText}>Naive Flooded Path</Text>
            </View>
          </View>
        </View>

        {/* Route Comparison Matrix */}
        <View style={styles.matrix}>
          {/* Safe Corridor Card */}
          <View style={[styles.routeCard, styles.safeCard]}>
            <View style={styles.routeHeader}>
              <Ionicons name="shield-checkmark" size={22} color="#047857" />
              <Text style={styles.routeBadge}>RL Policy</Text>
            </View>
            <Text style={styles.routeTitle}>Safe Corridor</Text>
            <Text style={styles.routeMeta}>
              {routeData?.rl_travel_time_min ?? '--'} min · max depth {routeData?.rl_max_flood_depth_cm ?? '--'} cm
            </Text>
            <Text style={styles.routePathSummary} numberOfLines={2}>
              {routeData?.rl_safe_route?.join(' → ') ?? 'Computing path...'}
            </Text>
            <Text
              style={[
                styles.routeNote,
                { color: isClearForVehicle ? '#047857' : '#DC2626', fontWeight: '800' },
              ]}
            >
              {isClearForVehicle
                ? `✓ Clear for ${vehicle} (${selectedVehicle.clearance} cm clearance)`
                : `⚠ Clearance exceeded for ${vehicle}`}
            </Text>
          </View>

          {/* Naive Path Card */}
          <View style={[styles.routeCard, styles.blockedCard]}>
            <View style={styles.routeHeader}>
              <Ionicons name="warning" size={22} color="#DC2626" />
              <Text style={[styles.routeBadge, styles.dangerBadge]}>
                {routeData?.hazard_avoided ? 'High Hazard' : 'Direct'}
              </Text>
            </View>
            <Text style={styles.routeTitle}>Naive Route</Text>
            <Text style={styles.routeMeta}>
              {routeData?.naive_travel_time_min ?? '--'} min · max depth {routeData?.naive_max_flood_depth_cm ?? '--'} cm
            </Text>
            <Text style={styles.routePathSummary} numberOfLines={2}>
              {routeData?.naive_route?.join(' → ') ?? 'Calculating...'}
            </Text>
            <Text style={styles.routeNote}>
              {routeData?.hazard_avoided
                ? 'Suppressed by RL Agent due to severe water accumulation barrier.'
                : 'Direct path passable under current conditions.'}
            </Text>
          </View>
        </View>

        {/* RL Recommendation Reason Banner */}
        <View style={styles.explanationBanner}>
          <Ionicons name="information-circle" size={20} color="#0369A1" />
          <Text style={styles.explanationText}>
            {routeData?.recommendation_reason || 'Loading agent routing policy from FastAPI...'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F8F7' },
  container: { paddingHorizontal: 18, paddingBottom: 34, gap: 16 },
  header: { gap: 4 },
  title: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  inputRow: { gap: 10 },
  inputPill: {
    height: 54,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE8E6',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectorLabel: { fontSize: 9, fontWeight: '800', color: '#64748B' },
  selectorValue: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginTop: 1 },
  recalculateBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0E7490',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleToolbar: { gap: 8, paddingVertical: 2 },
  vehicleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  vehicleChipActive: { backgroundColor: '#155E75', borderColor: '#155E75' },
  vehicleText: { fontSize: 12, fontWeight: '800', color: '#155E75' },
  vehicleTextActive: { color: '#FFFFFF' },
  routeMapCard: {
    borderRadius: 22,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE8E6',
  },
  mapHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  mapTitle: { fontSize: 15, fontWeight: '900', color: '#0F172A' },
  mapSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  mapScale: { borderRadius: 12, backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4 },
  mapScaleText: { fontSize: 11, fontWeight: '900', color: '#047857' },
  routeMapCanvas: { height: 260, borderRadius: 16, backgroundColor: '#F1F8F6', overflow: 'hidden' },
  markerPin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  markerOrigin: { backgroundColor: '#059669', width: 22, height: 22, borderRadius: 11 },
  markerDest: { backgroundColor: '#E11D48', width: 22, height: 22, borderRadius: 11 },
  legendRow: { flexDirection: 'row', gap: 16, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendLine: { width: 20, height: 4, borderRadius: 2 },
  safeLegend: { backgroundColor: '#059669' },
  blockedLegend: { backgroundColor: '#E11D48' },
  legendText: { fontSize: 11, color: '#475569', fontWeight: '700' },
  matrix: { flexDirection: 'row', gap: 10 },
  routeCard: { flex: 1, borderRadius: 18, padding: 14, borderWidth: 1, gap: 6 },
  safeCard: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  blockedCard: { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' },
  routeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  routeBadge: {
    fontSize: 9,
    fontWeight: '900',
    color: '#047857',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  dangerBadge: { color: '#B91C1C', backgroundColor: '#FEE2E2' },
  routeTitle: { fontSize: 15, fontWeight: '900', color: '#0F172A' },
  routeMeta: { fontSize: 11, color: '#475569', fontWeight: '700' },
  routePathSummary: { fontSize: 10, color: '#64748B', lineHeight: 14, marginVertical: 4 },
  routeNote: { fontSize: 11, color: '#334155', lineHeight: 15 },
  explanationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#E0F2FE',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  explanationText: { flex: 1, fontSize: 12, color: '#0369A1', fontWeight: '700', lineHeight: 17 },
});
