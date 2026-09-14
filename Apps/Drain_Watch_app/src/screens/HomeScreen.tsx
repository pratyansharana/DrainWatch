import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';
import type { MainTabScreenProps } from '../navigation/types';
import {
  fetchFloodPredictions,
  fetchSafeRoute,
  fetchRoadGeometry,
  CORRIDOR_LANDMARKS,
  SafeRouteResponse,
  FloodPredictionResponse,
} from '../../services/drainApi';

const DELHI_CORRIDOR_REGION: Region = {
  latitude: 28.6285,
  longitude: 77.2255,
  latitudeDelta: 0.024,
  longitudeDelta: 0.024,
};

export default function HomeScreen({ navigation }: MainTabScreenProps<'HomeTab'>) {
  const insets = useSafeAreaInsets();
  const [region, setRegion] = useState<Region>(DELHI_CORRIDOR_REGION);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);

  const [floodData, setFloodData] = useState<FloodPredictionResponse | null>(null);
  const [safeRouteData, setSafeRouteData] = useState<SafeRouteResponse | null>(null);
  const [corridorNodes, setCorridorNodes] = useState<any[]>([]);
  const [routePolyline, setRoutePolyline] = useState<{ latitude: number; longitude: number }[]>([]);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  const loadBackendTelemetry = useCallback(async () => {
    setLoading(true);
    console.log('[HomeScreen] Initiating telemetry fetch from FastAPI...');

    try {
      // 1. Fetch landmark flood depth predictions
      const floodRes = await fetchFloodPredictions(60.0, 15.0);
      setFloodData(floodRes);
      setIsLive(!floodRes.isFallback);

      if (floodRes && floodRes.landmarks) {
        const formattedNodes = floodRes.landmarks.map((item) => {
          const coord = CORRIDOR_LANDMARKS[item.landmark] || { latitude: 28.6258, longitude: 77.2342 };
          return {
            id: item.landmark.substring(0, 3).toUpperCase(),
            name: item.landmark,
            depth: item.predicted_depth_cm,
            risk: item.risk_level,
            prob: item.flood_probability,
            timeToFlood: item.time_to_flood_min,
            color:
              item.risk_level === 'CRITICAL'
                ? '#E11D48'
                : item.risk_level === 'HIGH'
                ? '#F59E0B'
                : item.risk_level === 'MEDIUM'
                ? '#EAB308'
                : '#10B981',
            coordinate: { latitude: coord.latitude, longitude: coord.longitude },
          };
        });
        setCorridorNodes(formattedNodes);
        if (!selectedNode && formattedNodes.length > 0) {
          setSelectedNode(formattedNodes[1] || formattedNodes[0]);
        }
      }

      // 2. Fetch RL Safe Route
      const routeRes = await fetchSafeRoute("Mandi House", "Rajiv Chowk Outer Circle");
      if (routeRes) {
        setSafeRouteData(routeRes);
        const pathCoords = await fetchRoadGeometry(routeRes.rl_safe_route);
        setRoutePolyline(pathCoords);
      }
    } catch (err) {
      console.error('[HomeScreen] Telemetry load error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedNode]);

  useEffect(() => {
    loadBackendTelemetry();
  }, []);

  return (
    <View style={styles.screen}>
      {/* Floating Header */}
      <View style={[styles.header, { top: Math.max(insets.top, 14) }]}>
        <View style={styles.brandMark}>
          <Ionicons name="water" size={20} color="#0E7490" />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.brand}>DrainMonitor Pilot Corridor</Text>
          <View style={styles.statusRow}>
            <View style={[styles.liveDot, { backgroundColor: isLive ? '#10B981' : '#F59E0B' }]} />
            <Text style={styles.statusText}>
              {isLive ? 'FastAPI Telemetry Live' : 'Offline Simulation Mode'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadBackendTelemetry}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#0E7490" />
          ) : (
            <Ionicons name="refresh" size={18} color="#0E7490" />
          )}
        </TouchableOpacity>
      </View>

      {/* Map Surface */}
      <View style={styles.mapCanvas}>
        <MapView
          style={StyleSheet.absoluteFill}
          region={region}
          onRegionChangeComplete={setRegion}
          showsCompass
          showsUserLocation
        >
          {/* Safe RL Polyline */}
          {routePolyline.length > 0 && (
            <Polyline
              coordinates={routePolyline}
              strokeColor="#0284C7"
              strokeWidth={5}
            />
          )}

          {/* Corridor Nodes Markers */}
          {corridorNodes.map((node) => (
            <Marker
              key={node.name}
              coordinate={node.coordinate}
              title={node.name}
              description={`${node.depth.toFixed(1)} cm depth · ${node.risk}`}
              onPress={() => setSelectedNode(node)}
            >
              <View style={[styles.mapMarker, { borderColor: node.color }]}>
                <Text style={styles.zoneId}>{node.id}</Text>
                <Text style={[styles.zoneDepth, { color: node.color }]}>
                  {node.depth.toFixed(0)}cm
                </Text>
              </View>
            </Marker>
          ))}
        </MapView>
      </View>

      {/* Telemetry Summary Cards */}
      <View style={[styles.telemetryCard, { bottom: 18 + insets.bottom }]}>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Rainfall</Text>
            <Text style={styles.statVal}>{floodData?.rainfall_mm_hr ?? 60} mm/h</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Max Depth</Text>
            <Text style={[styles.statVal, { color: '#E11D48' }]}>
              {floodData ? `${floodData.max_surface_depth_cm.toFixed(1)} cm` : '--'}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>RL Route Time</Text>
            <Text style={[styles.statVal, { color: '#0284C7' }]}>
              {safeRouteData ? `${safeRouteData.rl_travel_time_min} min` : '--'}
            </Text>
          </View>
        </View>

        <View style={styles.decisionDivider} />

        <View style={styles.decisionRow}>
          <Ionicons
            name={safeRouteData?.hazard_avoided ? 'shield-checkmark' : 'navigate-circle'}
            size={22}
            color={safeRouteData?.hazard_avoided ? '#059669' : '#0284C7'}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Q-Learning Safe Route Policy</Text>
            <Text style={styles.cardSub} numberOfLines={2}>
              {safeRouteData ? safeRouteData.recommendation_reason : 'Querying policy from FastAPI...'}
            </Text>
          </View>
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
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1 },
  brand: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 11, color: '#475569', fontWeight: '700' },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapCanvas: { flex: 1, backgroundColor: '#DDEBE8', overflow: 'hidden' },
  mapMarker: {
    minWidth: 54,
    borderRadius: 14,
    borderWidth: 2,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
  },
  zoneId: { fontSize: 10, fontWeight: '900', color: '#0F172A' },
  zoneDepth: { fontSize: 11, fontWeight: '900' },
  telemetryCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 22,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
    gap: 12,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  statBox: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  statLabel: { fontSize: 10, color: '#64748B', fontWeight: '700', textTransform: 'uppercase' },
  statVal: { fontSize: 14, fontWeight: '900', color: '#0F172A', marginTop: 2 },
  decisionDivider: { height: 1, backgroundColor: '#F1F5F9' },
  decisionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
  cardSub: { fontSize: 12, color: '#475569', marginTop: 2, lineHeight: 16 },
});