import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  checkBackendHealth,
  getApiBaseUrl,
  setApiBaseUrl,
  HealthResponse,
} from '../../services/drainApi';

const DISPATCH_LINKS = [
  { label: 'Disaster Cell', icon: 'megaphone-outline', detail: 'Central Delhi Ward command bridge' },
  { label: 'Traffic Control', icon: 'trail-sign-outline', detail: 'Barakhamba & KG Marg diversion units' },
  { label: 'Medical Services', icon: 'medkit-outline', detail: 'Ambulance safe-elevation lane' },
  { label: 'Pump Operations', icon: 'construct-outline', detail: 'Rajiv Chowk drainage crew dispatch' },
] as const;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [armed, setArmed] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [backendUrl, setBackendUrlState] = useState<string>(getApiBaseUrl());
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [healthStatus, setHealthStatus] = useState<HealthResponse | null>(null);

  const pingBackend = useCallback(async () => {
    setTestingConnection(true);
    try {
      const res = await checkBackendHealth();
      setHealthStatus(res);
    } catch (e) {
      console.warn('[SettingsScreen] Health check ping error:', e);
    } finally {
      setTestingConnection(false);
    }
  }, []);

  useEffect(() => {
    pingBackend();
  }, [pingBackend]);

  const handleSaveUrl = async () => {
    const cleaned = backendUrl.replace(/\s+/g, '');
    if (!cleaned) return;
    setBackendUrlState(cleaned);
    await setApiBaseUrl(cleaned);
    await pingBackend();
    Alert.alert('Backend URL Saved', `Active URL is now:\n${getApiBaseUrl()}`);
  };

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
          <Text style={styles.title}>Emergency Operations</Text>
          <Text style={styles.subtitle}>FastAPI backend sync &amp; emergency dispatch.</Text>
        </View>

        {/* Backend Configuration & Live Telemetry Ping */}
        <View style={styles.configCard}>
          <View style={styles.configHeader}>
            <Ionicons
              name={healthStatus?.status === 'online' ? 'cloud-done' : 'cloud-offline'}
              size={22}
              color={healthStatus?.status === 'online' ? '#059669' : '#D97706'}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.configTitle}>FastAPI Server Connectivity</Text>
              <Text style={styles.configSub}>
                {healthStatus?.status === 'online'
                  ? `Online · Grid ${healthStatus.dem_size} · RL Agent Ready`
                  : 'Offline simulation fallback active'}
              </Text>
            </View>
            <TouchableOpacity style={styles.pingBtn} onPress={pingBackend} disabled={testingConnection}>
              {testingConnection ? (
                <ActivityIndicator size="small" color="#0E7490" />
              ) : (
                <Ionicons name="refresh" size={16} color="#0E7490" />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.urlInputRow}>
            <TextInput
              style={styles.urlInput}
              value={backendUrl}
              onChangeText={(val) => setBackendUrlState(val.replace(/\s+/g, ''))}
              placeholder="https://mighty-planes-tie.loca.lt"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.saveUrlBtn} onPress={handleSaveUrl}>
              <Text style={styles.saveUrlText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SOS Panel */}
        <View style={styles.sosPanel}>
          <Pressable
            onPressIn={startHold}
            onPressOut={cancelHold}
            style={({ pressed }) => [
              styles.sosButton,
              pressed && styles.sosButtonPressed,
              armed && styles.sosButtonArmed,
            ]}
          >
            <Ionicons name={armed ? 'radio' : 'finger-print-outline'} size={40} color="#FFFFFF" />
            <Text style={styles.sosTitle}>
              {armed ? 'Emergency Broadcast Armed' : 'Initiate Protocol'}
            </Text>
            <Text style={styles.sosSub}>Emergency Broadcast · 2 sec long-press</Text>
          </Pressable>
        </View>

        {/* Dispatch Grid */}
        <View style={styles.grid}>
          {DISPATCH_LINKS.map((item) => (
            <TouchableOpacity key={item.label} style={styles.actionCard}>
              <View style={styles.actionIcon}>
                <Ionicons name={item.icon} size={22} color="#0F766E" />
              </View>
              <Text style={styles.actionTitle}>{item.label}</Text>
              <Text style={styles.actionDetail}>{item.detail}</Text>
              <Text style={styles.actionLink}>Encrypted dispatch</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Diagnostics */}
        <View style={styles.diagnosticFooter}>
          <Text selectable style={styles.diagText}>Corridor: Mandi House → Rajiv Chowk</Text>
          <Text selectable style={styles.diagText}>Pilot Grid: 30x30 Cells</Text>
          <Text selectable style={styles.diagText}>
            Mode: {healthStatus?.isFallback ? 'SURROGATE CACHE' : 'LIVE FASTAPI'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7FAF9' },
  container: { paddingHorizontal: 18, paddingBottom: 34, gap: 16 },
  header: { alignItems: 'center', gap: 4 },
  title: { fontSize: 24, fontWeight: '900', color: '#0F172A', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#64748B', textAlign: 'center' },
  configCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  configHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  configTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
  configSub: { fontSize: 11, color: '#64748B', marginTop: 1 },
  pingBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urlInputRow: { flexDirection: 'row', gap: 8 },
  urlInput: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
  },
  saveUrlBtn: {
    borderRadius: 12,
    backgroundColor: '#0E7490',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveUrlText: { color: '#FFFFFF', fontWeight: '900', fontSize: 12 },
  sosPanel: { alignItems: 'center', paddingVertical: 4 },
  sosButton: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#BE123C',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    shadowColor: '#BE123C',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 8,
  },
  sosButtonPressed: { transform: [{ scale: 0.98 }], backgroundColor: '#9F1239' },
  sosButtonArmed: { backgroundColor: '#7F1D1D' },
  sosTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  sosSub: { color: '#FFE4E6', fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    width: '48%',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CCFBF1',
    marginBottom: 10,
  },
  actionTitle: { fontSize: 14, color: '#0F172A', fontWeight: '900' },
  actionDetail: { fontSize: 11, color: '#64748B', lineHeight: 15, marginTop: 4 },
  actionLink: { fontSize: 10, color: '#0F766E', fontWeight: '900', marginTop: 10 },
  diagnosticFooter: {
    borderRadius: 16,
    padding: 12,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  diagText: { color: '#BAE6FD', fontSize: 11, fontWeight: '800' },
});
