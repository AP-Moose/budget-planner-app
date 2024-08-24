import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

function MonthNavigator({ currentMonth, setCurrentMonth }) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentMonth.getFullYear());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const navigateMonth = (direction) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentMonth(newDate);
  };

  const handleSelectMonth = () => {
    const newDate = new Date(selectedYear, selectedMonth);
    setCurrentMonth(newDate);
    setIsModalVisible(false);
  };

  const isCurrentMonth = currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigateMonth(-1)}>
        <Ionicons name="chevron-back" size={24} color="black" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setIsModalVisible(true)}>
        <Text style={styles.currentMonth}>
          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigateMonth(1)}>
        <Ionicons name="chevron-forward" size={24} color="black" />
      </TouchableOpacity>

      {!isCurrentMonth && (
        <TouchableOpacity style={styles.currentMonthButton} onPress={() => setCurrentMonth(new Date())}>
          <Text style={styles.buttonText}>Return to {new Date().toLocaleString('default', { month: 'long' })}</Text>
        </TouchableOpacity>
      )}

      <Modal visible={isModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Month and Year</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedMonth}
                onValueChange={(itemValue) => setSelectedMonth(itemValue)}
                style={[styles.picker, { flex: 1 }]}
              >
                {months.map((month, index) => (
                  <Picker.Item label={month} value={index} key={index} />
                ))}
              </Picker>
              <Picker
                selectedValue={selectedYear}
                onValueChange={(itemValue) => setSelectedYear(itemValue)}
                style={[styles.picker, { flex: 1 }]}
              >
                {[...Array(20)].map((_, index) => {
                  const year = new Date().getFullYear() - 10 + index;
                  return <Picker.Item label={year.toString()} value={year} key={index} />;
                })}
              </Picker>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.modalButton, styles.doneButton]} onPress={handleSelectMonth}>
                <Text style={styles.modalButtonText}>Done</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#e0e0e0',
    marginTop: 10,
  },
  currentMonth: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  currentMonthButton: {
    backgroundColor: '#4CAF50',
    padding: 5,
    borderRadius: 5,
    marginLeft: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  picker: {
    width: '100%',
    height: 150,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  doneButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default MonthNavigator;
