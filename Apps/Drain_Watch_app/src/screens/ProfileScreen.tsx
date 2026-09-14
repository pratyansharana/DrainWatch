import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  processCitizenReport,
  CORRIDOR_LANDMARKS,
  CitizenReportResponse,
} from '../../services/drainApi';

interface LocalIncident {
  id: string;
  zone: string;
  depth: number;
  hazardType: string;
  status: 'GenAI Verified' | 'Pending Verification';
  time: string;
}

const INITIAL_INCIDENTS: LocalIncident[] = [
  { id: 'INC-8042', zone: 'Barakhamba Rd Metro', depth: 42, hazardType: 'Severe Drain Trash Clogging', status: 'GenAI Verified', time: '4 min ago' },
  { id: 'INC-8038', zone: 'Tolstoy Marg Junction', depth: 24, hazardType: 'Catch-basin Overflow', status: 'Pending Verification', time: '18 min ago' },
  { id: 'INC-8019', zone: 'KG Marg Junction', depth: 9, hazardType: 'Pavement Ponding', status: 'GenAI Verified', time: '1 hr ago' },
];

const LANDMARK_NAMES = Object.keys(CORRIDOR_LANDMARKS);

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [selectedLandmark, setSelectedLandmark] = useState<string>(LANDMARK_NAMES[1]);
  const [depth, setDepth] = useState(35);
  const [reportText, setReportText] = useState(
    'Severe drain blockage near Barakhamba Rd metro exit due to solid plastic debris. Water accumulation rising over curbs.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [incidents, setIncidents] = useState<LocalIncident[]>(INITIAL_INCIDENTS);
  const [lastGenAIResult, setLastGenAIResult] = useState<CitizenReportResponse | null>(null);

  const handleReportSubmit = async () => {
    if (!reportText.trim()) {
      Alert.alert('Empty Report', 'Please enter a description of the blockage or flood incident.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await processCitizenReport(reportText);
      setLastGenAIResult(result);

      const newIncident: LocalIncident = {
        id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
        zone: result.extracted_event.location || selectedLandmark,
        depth: depth,
        hazardType: result.extracted_event.hazard_type || 'Street Runoff Surge',
        status: 'GenAI Verified',
        time: 'Just now',
      };

      setIncidents((prev) => [newIncident, ...prev]);
      Alert.alert(
        'GenAI Telemetry Ingested',
        `Location: ${result.extracted_event.location}\nBlockage Ratio: ${Math.round(
          result.extracted_event.blockage_ratio * 100
        )}%\nUrgency: ${result.extracted_event.urgency}\n\nFastAPI updated pipe stress & recomputed safe RL corridor.`
      );
    } catch (e: any) {
      Alert.alert('Submission Error', e?.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top, 16) + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.kicker}>GenAI Citizen Intelligence</Text>
            <Text style={styles.title}>Incident Telemetry</Text>
          </View>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryMetric}>
              <Text style={styles.metricValue}>7</Text>
              <Text style={styles.metricLabel}>Monitored Nodes</Text>
            </View>
            <View style={styles.summaryMetric}>
              <Text style={styles.metricValue}>300</Text>
              <Text style={styles.metricLabel}>RL Episodes</Text>
            </View>
          </View>
        </View>

        {/* Input Form */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Log Infrastructure Anomaly</Text>

          {/* Location Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.locationScroll}>
            {LANDMARK_NAMES.map((name) => {
              const active = name === selectedLandmark;
              return (
                <TouchableOpacity
                  key={name}
                  style={[styles.locationChip, active && styles.locationChipActive]}
                  onPress={() => {
                    setSelectedLandmark(name);
                    setReportText(`Drain blockage observed near ${name}. Water accumulation rising.`);
                  }}
                >
                  <Text style={[styles.locationChipText, active && styles.locationChipTextActive]}>
                    {name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Natural Language Text Area */}
          <TextInput
            style={styles.textArea}
            multiline
            value={reportText}
            onChangeText={setReportText}
            placeholder="Describe blocked drain, overflow point, plastic debris, or road cave-in..."
            placeholderTextColor="#94A3B8"
          />

          {/* Observed Depth Selector */}
          <View style={styles.depthHeader}>
            <Text style={styles.depthLabel}>Observed Water Depth</Text>
            <Text style={styles.depthValue}>{depth} cm</Text>
          </View>
          <View style={styles.depthSlider}>
            <View style={[styles.depthFill, { width: `${depth}%` }]} />
            {[0, 20, 40, 60, 80, 100].map((value) => (
              <TouchableOpacity key={value} style={styles.depthHit} onPress={() => setDepth(value)}>
                <View style={[styles.depthTick, depth === value && styles.depthTickActive]} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleReportSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Submit to GenAI &amp; Reroute</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* GenAI Last Extraction Details */}
        {lastGenAIResult && (
          <View style={styles.genAiCard}>
            <View style={styles.genAiHeader}>
              <Ionicons name="hardware-chip-outline" size={20} color="#0891B2" />
              <Text style={styles.genAiTitle}>FastAPI GenAI Event Parsed</Text>
            </View>
            <Text style={styles.genAiMeta}>
              Location: {lastGenAIResult.extracted_event.location} · Blockage: {Math.round(lastGenAIResult.extracted_event.blockage_ratio * 100)}%
            </Text>
            <Text style={styles.genAiMeta}>
              Hazard: {lastGenAIResult.extracted_event.hazard_type} (Urgency: {lastGenAIResult.extracted_event.urgency})
            </Text>
            <Text style={styles.genAiSub}>
              {lastGenAIResult.new_safe_route.recommendation_reason}
            </Text>
          </View>
        )}

        {/* Recent Incidents Feed */}
        <View style={styles.streamHeader}>
          <Text style={styles.titleSmall}>Incident Stream</Text>
          <Text style={styles.streamSub}>FastAPI State Queue</Text>
        </View>

        {incidents.map((incident) => {
          const verified = incident.status === 'GenAI Verified';
          return (
            <View key={incident.id} style={styles.incidentCard}>
              <View style={[styles.incidentIcon, verified ? styles.verifiedIcon : styles.pendingIcon]}>
                <Ionicons
                  name={verified ? 'checkmark-circle' : 'hourglass-outline'}
                  size={20}
                  color={verified ? '#047857' : '#B45309'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.incidentTitle}>{incident.zone}</Text>
                <Text style={styles.incidentMeta}>
                  {incident.hazardType} · {incident.depth} cm · {incident.time}
                </Text>
              </View>
              <View style={[styles.badge, verified ? styles.badgeVerified : styles.badgePending]}>
                <Text style={[styles.badgeText, verified ? styles.badgeTextVerified : styles.badgeTextPending]}>
                  {incident.status}
                </Text>
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
  summaryCard: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: '#0F172A',
    gap: 16,
  },
  kicker: { fontSize: 11, color: '#67E8F9', fontWeight: '900', textTransform: 'uppercase' },
  title: { fontSize: 24, color: '#FFFFFF', fontWeight: '900', marginTop: 4 },
  summaryGrid: { flexDirection: 'row', gap: 12 },
  summaryMetric: { flex: 1, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', padding: 12 },
  metricValue: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  metricLabel: { color: '#CBD5E1', fontSize: 11, marginTop: 2 },
  formCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: '#0F172A' },
  locationScroll: { gap: 8, paddingVertical: 4 },
  locationChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locationChipActive: { backgroundColor: '#0E7490', borderColor: '#0E7490' },
  locationChipText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  locationChipTextActive: { color: '#FFFFFF' },
  textArea: {
    minHeight: 80,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    padding: 12,
    color: '#0F172A',
    fontSize: 13,
    textAlignVertical: 'top',
  },
  depthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  depthLabel: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  depthValue: { fontSize: 14, fontWeight: '900', color: '#0E7490' },
  depthSlider: { height: 22, borderRadius: 11, flexDirection: 'row', backgroundColor: '#E2E8F0', overflow: 'hidden' },
  depthFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#22D3EE' },
  depthHit: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  depthTick: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
  depthTickActive: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#0F172A' },
  submitBtn: {
    marginTop: 6,
    borderRadius: 18,
    backgroundColor: '#0F766E',
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  genAiCard: {
    borderRadius: 18,
    backgroundColor: '#ECFEFF',
    padding: 14,
    borderWidth: 1,
    borderColor: '#A5F3FC',
    gap: 4,
  },
  genAiHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  genAiTitle: { fontSize: 14, fontWeight: '900', color: '#0891B2' },
  genAiMeta: { fontSize: 12, color: '#0F172A', fontWeight: '800' },
  genAiSub: { fontSize: 11, color: '#334155', marginTop: 4, lineHeight: 15 },
  streamHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 },
  titleSmall: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  streamSub: { fontSize: 11, fontWeight: '800', color: '#64748B' },
  incidentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  incidentIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  verifiedIcon: { backgroundColor: '#D1FAE5' },
  pendingIcon: { backgroundColor: '#FEF3C7' },
  incidentTitle: { fontSize: 13, fontWeight: '900', color: '#0F172A' },
  incidentMeta: { fontSize: 11, color: '#64748B', marginTop: 2 },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  badgeVerified: { backgroundColor: '#D1FAE5' },
  badgePending: { backgroundColor: '#FEF3C7' },
  badgeText: { fontSize: 10, fontWeight: '900' },
  badgeTextVerified: { color: '#047857' },
  badgeTextPending: { color: '#92400E' },
});
