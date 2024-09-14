import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.errorTitle}>Oops! Something went wrong.</Text>
          <Text style={styles.errorMessage}>{this.state.error?.toString()}</Text>
          <Text style={styles.errorInfo}>{this.state.errorInfo?.componentStack}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#e74c3c',
  },
  errorMessage: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
    color: '#34495e',
  },
  errorInfo: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
});

export default ErrorBoundary;