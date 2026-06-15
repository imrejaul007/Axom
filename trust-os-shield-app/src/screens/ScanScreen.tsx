/**
 * TrustOS Shield - Scan Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { checkSMS, checkLink, checkPhone } from '../services/api';

type ScanType = 'sms' | 'link' | 'call';

export default function ScanScreen() {
  const [scanType, setScanType] = useState<ScanType>('sms');
  const [input, setInput] = useState('');
  const [sender, setSender] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleScan = async () => {
    if (!input.trim()) {
      Alert.alert('Error', 'Please enter content to scan');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      let scanResult;

      if (scanType === 'sms') {
        scanResult = await checkSMS(input, sender);
      } else if (scanType === 'link') {
        scanResult = await checkLink(input);
      } else {
        scanResult = await checkPhone(input);
      }

      setResult(scanResult);
    } catch (error) {
      Alert.alert('Error', 'Failed to scan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return '#D32F2F';
    if (score >= 50) return '#F57C00';
    if (score >= 30) return '#FFC107';
    return '#4CAF50';
  };

  const renderResult = () => {
    if (!result) return null;

    const isScam = result.isScam;
    const riskScore = result.riskScore || result.reputation?.score || 0;
    const color = getRiskColor(riskScore);

    return (
      <View style={[styles.resultCard, { borderColor: color }]}>
        <View style={styles.resultHeader}>
          <Text style={[styles.resultIcon, { color }]}>
            {isScam ? '⚠️' : '✅'}
          </Text>
          <Text style={[styles.resultTitle, { color }]}>
            {isScam ? 'SCAM DETECTED!' : 'Looks Safe'}
          </Text>
        </View>

        <View style={styles.riskScore}>
          <Text style={styles.riskLabel}>Risk Score</Text>
          <Text style={[styles.riskValue, { color }]}>{riskScore}%</Text>
        </View>

        {result.reasons?.length > 0 && (
          <View style={styles.reasonsSection}>
            <Text style={styles.reasonsTitle}>⚠️ Why this is dangerous:</Text>
            {result.reasons.map((reason: string, i: number) => (
              <Text key={i} style={styles.reasonItem}>• {reason}</Text>
            ))}
          </View>
        )}

        {result.recommendations?.length > 0 && (
          <View style={styles.recsSection}>
            <Text style={styles.recsTitle}>🛡️ What to do:</Text>
            {result.recommendations.map((rec: string, i: number) => (
              <Text key={i} style={styles.recItem}>• {rec}</Text>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.reportButton}>
          <Text style={styles.reportButtonText}>🚫 Report as Scam</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🔍 Scan</Text>
          <Text style={styles.subtitle}>Check messages, links, and calls for scams</Text>
        </View>

        {/* Scan Type Selector */}
        <View style={styles.typeSelector}>
          {(['sms', 'link', 'call'] as ScanType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.typeButton, scanType === type && styles.typeButtonActive]}
              onPress={() => {
                setScanType(type);
                setResult(null);
              }}
            >
              <Text style={[styles.typeButtonText, scanType === type && styles.typeButtonTextActive]}>
                {type === 'sms' ? '📱 SMS' : type === 'link' ? '🔗 Link' : '📞 Call'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Input */}
        <View style={styles.inputSection}>
          {scanType !== 'call' ? (
            <>
              <TextInput
                style={styles.textInput}
                placeholder={
                  scanType === 'sms'
                    ? 'Paste SMS or message content here...'
                    : 'Enter URL to check...'
                }
                value={input}
                onChangeText={setInput}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              {scanType === 'sms' && (
                <TextInput
                  style={[styles.textInput, styles.senderInput]}
                  placeholder="Sender (optional)"
                  value={sender}
                  onChangeText={setSender}
                  keyboardType="phone-pad"
                />
              )}
            </>
          ) : (
            <TextInput
              style={[styles.textInput, styles.phoneInput]}
              placeholder="Enter phone number"
              value={input}
              onChangeText={setInput}
              keyboardType="phone-pad"
            />
          )}
        </View>

        {/* Scan Button */}
        <TouchableOpacity
          style={[styles.scanButton, loading && styles.scanButtonDisabled]}
          onPress={handleScan}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.scanButtonText}>🔍 Scan Now</Text>
          )}
        </TouchableOpacity>

        {/* Result */}
        {renderResult()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E3A5F',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  typeButtonActive: {
    backgroundColor: '#1E3A5F',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  inputSection: {
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  senderInput: {
    marginTop: 12,
    minHeight: 50,
  },
  phoneInput: {
    minHeight: 60,
    fontSize: 20,
  },
  scanButton: {
    backgroundColor: '#1E3A5F',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  scanButtonDisabled: {
    opacity: 0.7,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resultIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  riskScore: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  riskLabel: {
    fontSize: 14,
    color: '#666',
  },
  riskValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 4,
  },
  reasonsSection: {
    marginBottom: 16,
  },
  reasonsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D32F2F',
    marginBottom: 8,
  },
  reasonItem: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    marginBottom: 4,
  },
  recsSection: {
    marginBottom: 16,
  },
  recsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#388E3C',
    marginBottom: 8,
  },
  recItem: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    marginBottom: 4,
  },
  reportButton: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  reportButtonText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '600',
  },
});
