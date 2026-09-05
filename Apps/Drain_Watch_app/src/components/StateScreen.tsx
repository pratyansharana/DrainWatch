import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type StateVariant = 'offline' | 'error' | 'empty' | 'maintenance';

interface StateScreenProps {
  variant?: StateVariant;
  title?: string;
  description?: string;
  buttonText?: string;
  onAction?: () => void;
  isLoading?: boolean;
}

const DEFAULT_CONFIGS: Record<StateVariant, { icon: keyof typeof Ionicons.glyphMap; title: string; description: string; buttonText: string; color: string }> = {
  offline: {
    icon: 'cloud-offline-outline',
    title: 'No Internet Connection',
    description: 'Please check your Wi-Fi or cellular network settings and try again.',
    buttonText: 'Retry Connection',
    color: '#3B82F6',
  },
  error: {
    icon: 'alert-circle-outline',
    title: 'Something Went Wrong',
    description: 'We encountered an unexpected issue while processing your request.',
    buttonText: 'Try Again',
    color: '#EF4444',
  },
  empty: {
    icon: 'file-tray-outline',
    title: 'No Data Available',
    description: 'There are currently no items or activity to display in this view.',
    buttonText: 'Refresh',
    color: '#6B7280',
  },
  maintenance: {
    icon: 'construct-outline',
    title: 'Under Maintenance',
    description: 'We are performing scheduled improvements. Please check back shortly.',
    buttonText: 'Check Status',
    color: '#F59E0B',
  },
};

export const StateScreen: React.FC<StateScreenProps> = ({
  variant = 'empty',
  title,
  description,
  buttonText,
  onAction,
  isLoading = false,
}) => {
  const config = DEFAULT_CONFIGS[variant];

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrapper, { backgroundColor: `${config.color}15` }]}>
        <Ionicons name={config.icon} size={48} color={config.color} />
      </View>

      <Text style={styles.title}>{title || config.title}</Text>
      <Text style={styles.description}>{description || config.description}</Text>

      {onAction && (
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: config.color }]} 
          onPress={onAction}
          disabled={isLoading}
        >
          <Text style={styles.actionButtonText}>
            {isLoading ? 'Retrying...' : (buttonText || config.buttonText)}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#F9FAFB',
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
