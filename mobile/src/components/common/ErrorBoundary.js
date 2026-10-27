import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from './IconCompat';

/**
 * Global error boundary — catches unhandled JS errors and shows
 * a recovery screen instead of crashing.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to crash reporting service in production
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#FBE6E6', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Ionicons name="warning-outline" size={40} color="#D24B4B" />
          </View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#211F1C', marginBottom: 8, textAlign: 'center' }}>
            Something went wrong
          </Text>
          <Text style={{ fontSize: 14, color: '#9A948A', textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
            The app encountered an unexpected error. Please try again.
          </Text>
          <TouchableOpacity
            onPress={this.handleRetry}
            style={{
              backgroundColor: '#1F4A45',
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 16,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
