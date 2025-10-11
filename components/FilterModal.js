// FilterModal.jsx
import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FilterModal = ({ visible, onClose, filters, onFilterChange, options }) => {
  const renderFilterOptions = (type, values) => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {values.map((value, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.filterOption,
              filters[type] === value && styles.filterOptionSelected
            ]}
            onPress={() => onFilterChange(type, value)}
          >
            <Text style={styles.filterOptionText}>{value}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent 
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={30} color="gray" />
          </TouchableOpacity>
          
          <Text style={styles.modalTitle}>Filter Scholarships</Text>
          
          {renderFilterOptions('major', options.majors)}
          {renderFilterOptions('country', options.countries)}
          {renderFilterOptions('funding', options.fundingTypes)}
          
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0, 0, 0, 0.5)' 
  },
  modalContent: { 
    width: '90%', 
    backgroundColor: 'white', 
    padding: 20, 
    borderRadius: 10 
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 16 
  },
  filterContainer: { 
    marginVertical: 5, 
    paddingHorizontal: 10 
  },
  filterOption: { 
    backgroundColor: '#e0e0e0', 
    padding: 8, 
    height: 42, 
    marginRight: 8, 
    borderRadius: 18 
  },
  filterOptionSelected: { 
    backgroundColor: '#007bff' 
  },
  filterOptionText: { 
    color: 'black' 
  },
  modalButtons: { 
    marginTop: 20 
  },
  closeButton: { 
    alignItems: 'flex-end', 
    marginVertical: 10 
  },
  button: { 
    backgroundColor: '#004aad', 
    paddingVertical: 10, 
    paddingHorizontal: 16, 
    borderRadius: 30, 
    alignItems: 'center', 
    elevation: 13 
  },
  buttonText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#fff' 
  }
});

export default FilterModal;