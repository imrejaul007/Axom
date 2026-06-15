import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

export default function Home() {
  const router = useRouter();

  const handleLaunch = () => {
    // Navigation to launcher or dashboard
    console.log('Launching Cosmic OS...');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.logo}>COSMIC OS</Text>
          <Text style={styles.star}>ASTEROID</Text>
          <Text style={styles.tagline}>The Future of Mobile</Text>

          <View style={styles.statusContainer}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>System Online</Text>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleLaunch}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>LAUNCH</Text>
          </TouchableOpacity>

          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>v1.0.0</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a1a',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logo: {
    fontSize: 42,
    fontWeight: '900',
    color: '#00d4ff',
    letterSpacing: 8,
    textShadowColor: '#00d4ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  star: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff6b35',
    letterSpacing: 12,
    marginTop: 4,
  },
  tagline: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 24,
    letterSpacing: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00ff88',
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#00ff88',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#00d4ff',
    paddingHorizontal: 60,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 50,
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  buttonText: {
    color: '#0a0a1a',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 4,
  },
  versionContainer: {
    position: 'absolute',
    bottom: 60,
  },
  versionText: {
    fontSize: 12,
    color: '#4b5563',
    letterSpacing: 1,
  },
});