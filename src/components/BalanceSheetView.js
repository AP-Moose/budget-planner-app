import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const BalanceSheetView = ({ reportData }) => {
  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  const renderAssetSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Assets</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Cash:</Text>
        <Text style={styles.value}>{formatCurrency(reportData.assets.cash)}</Text>
      </View>
      <Text style={styles.subSectionTitle}>Investments</Text>
      {Object.entries(reportData.assets.investments).map(([name, value]) => (
        <View key={name} style={styles.row}>
          <Text style={styles.label}>{name}:</Text>
          <Text style={styles.value}>{formatCurrency(value)}</Text>
        </View>
      ))}
      <View style={[styles.row, styles.total]}>
        <Text style={styles.label}>Total Assets:</Text>
        <Text style={styles.value}>{formatCurrency(reportData.assets.total)}</Text>
      </View>
    </View>
  );

  const renderLiabilitySection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Liabilities</Text>
      <Text style={styles.subSectionTitle}>Credit Cards</Text>
      {Object.entries(reportData.liabilities.creditCards).map(([name, balance]) => (
        <View key={name} style={styles.row}>
          <Text style={styles.label}>{name}:</Text>
          <Text style={styles.value}>{formatCurrency(balance)}</Text>
        </View>
      ))}
      <Text style={styles.subSectionTitle}>Loans</Text>
      {Object.entries(reportData.liabilities.loans).map(([name, balance]) => (
        <View key={name} style={styles.row}>
          <Text style={styles.label}>{name}:</Text>
          <Text style={styles.value}>{formatCurrency(balance)}</Text>
        </View>
      ))}
      <View style={[styles.row, styles.total]}>
        <Text style={styles.label}>Total Liabilities:</Text>
        <Text style={styles.value}>{formatCurrency(reportData.liabilities.total)}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Balance Sheet</Text>
      <Text style={styles.date}>As of: {new Date(reportData.asOfDate).toLocaleDateString()}</Text>
      {renderAssetSection()}
      {renderLiabilitySection()}
      <View style={[styles.row, styles.netWorth]}>
        <Text style={styles.label}>Net Worth:</Text>
        <Text style={styles.value}>{formatCurrency(reportData.netWorth)}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  total: {
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingTop: 8,
    marginTop: 8,
  },
  netWorth: {
    borderTopWidth: 2,
    borderTopColor: '#000',
    paddingTop: 16,
    marginTop: 16,
  },
});

export default BalanceSheetView;