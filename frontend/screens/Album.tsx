import React, { useState } from "react";
import { View, Text, FlatList, Button, Image, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';

import CustomText from "../components/CustomText";

import sortIconSvg from "../assets/icons/sort.svg";
import settingsIconSvg from "../assets/icons/settings.svg";

import { SvgProps } from 'react-native-svg';

import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import { Ionicons } from '@expo/vector-icons';

const screenWidth = wp('100%');

type FolderListProps = {
  folderList: string[];
  selectFolder: (folderName: string) => void;
  handleDelete: (folderName: string) => void;
};

const FolderList: React.FC<FolderListProps> = ({ folderList, selectFolder, handleDelete }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);
  const [selectedSortMethod, setSelectedSortMethod] = useState('최신순');

  const openSortModal = () => {
    setIsSortModalVisible(true);
  };

  const closeSortModal = () => {
    setIsSortModalVisible(false);
  };

  const handleSortMethodSelect = (sortMethod: string) => {
    setSelectedSortMethod(sortMethod);
    closeSortModal();
  };

  const renderItem = ({ item }: { item: string }) => (

    <View style={{ flex: 1, paddingTop: 5, alignItems: "center" }}>
    <Image source={{ uri: item }} style={{ width: screenWidth, height: 200 }} />
    <View style={{ position: 'absolute', bottom: 0, left: 0 }}>
      <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', paddingLeft:15  }}>앨범 이름</Text>
      <Text style={styles.albumTextLeft}>(개수)</Text>
    </View>

    <View style={{ position: 'absolute', bottom: 0, right: 0 }}>
      <Text style={styles.albumTextRight}>2023-07-06</Text>
    </View>
  </View>

    // <View style={{ flex: 1, paddingTop: 5, alignItems: "center" }}>
    //   <Image source={{ uri: item }} style={{ width: 360, height: 200 }} />
    //   {/* You can render additional image information here. */}
    // </View>
  );
  const dummyFolder = [
    'https://fastly.picsum.photos/id/179/200/200.jpg?hmac=I0g6Uht7h-y3NHqWA4e2Nzrnex7m-RceP1y732tc4Lw',
    'https://fastly.picsum.photos/id/179/200/200.jpg?hmac=I0g6Uht7h-y3NHqWA4e2Nzrnex7m-RceP1y732tc4Lw',
    'https://fastly.picsum.photos/id/179/200/200.jpg?hmac=I0g6Uht7h-y3NHqWA4e2Nzrnex7m-RceP1y732tc4Lw',
    'https://fastly.picsum.photos/id/179/200/200.jpg?hmac=I0g6Uht7h-y3NHqWA4e2Nzrnex7m-RceP1y732tc4Lw',
    'https://fastly.picsum.photos/id/179/200/200.jpg?hmac=I0g6Uht7h-y3NHqWA4e2Nzrnex7m-RceP1y732tc4Lw',
  ];

  let SortIconComponent: React.FC<SvgProps> | undefined = sortIconSvg;
  let SettingIconComponent: React.FC<SvgProps> | undefined = settingsIconSvg;

  return (

    <React.Fragment>

      
      <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', height: 50, backgroundColor: 'white', alignItems: 'center', justifyContent: 'flex-end' }}>
          <View style={{ flexDirection: 'row'}}>
            
            <TouchableOpacity onPress={() => {openSortModal()}}>
              <SortIconComponent style={styles.imgBox} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {}}>
              <SettingIconComponent style={styles.imgBox} />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={dummyFolder}
          keyExtractor={(item, index) => String(index)}
          renderItem={renderItem}
        />

      <View style={styles.container}>
        <TouchableOpacity style={styles.button}>
          <Ionicons name="ios-add" size={48} color="white" onPress={() => setIsModalVisible(true)} />
        </TouchableOpacity>
      </View>
    </View>
    
    <Modal visible={isModalVisible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text>앨범 추가</Text>
            <TextInput
              style={styles.input}
              onChangeText={() => {}}
              value={""}
            />
          <View style={styles.buttonContainer}>
            <Text style={styles.modalButtonCancel} onPress={() => setIsModalVisible(false)}>취소</Text>
            <Text>|</Text>
            <Text style={styles.modalButtonOk} onPress={() => setIsModalVisible(false)}>추가</Text>
          </View>
        </View>
      </View>
    </Modal>

    <Modal visible={isSortModalVisible} animationType="slide" transparent={true}>
      
        <View style={styles.modalContainer}>
        <TouchableOpacity
        activeOpacity={1}
        onPress={() => setIsSortModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>정렬</Text>
            <TouchableOpacity
              style={[styles.sortMethodButton, selectedSortMethod === '최신순' && styles.selectedSortMethod]}

              onPress={() => handleSortMethodSelect('최신순')}
            >
            <Text style={[styles.sortMethodText, selectedSortMethod === '최신순' && styles.selectedSortMethodText]}>최신순</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortMethodButton, selectedSortMethod === '오래된순' && styles.selectedSortMethod]}
              onPress={() => handleSortMethodSelect('오래된순')}
            >
              <Text style={[styles.sortMethodText, selectedSortMethod === '오래된순' && styles.selectedSortMethodText]}>오래된순</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortMethodButton, selectedSortMethod === '제목순' && styles.selectedSortMethod]}
              onPress={() => handleSortMethodSelect('제목순')}
            >
              <Text style={[styles.sortMethodText, selectedSortMethod === '제목순' && styles.selectedSortMethodText]}>제목순</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortMethodButton, selectedSortMethod === '사진많은순' && styles.selectedSortMethod]}
              onPress={() => handleSortMethodSelect('사진많은순')}
            >
              <Text style={[styles.sortMethodText, selectedSortMethod === '사진많은순' && styles.selectedSortMethodText]}>사진많은순</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortMethodButton, selectedSortMethod === '사진적은순' && styles.selectedSortMethod]}
              onPress={() => handleSortMethodSelect('사진적은순')}
            >
              <Text style={[styles.sortMethodText, selectedSortMethod === '사진적은순' && styles.selectedSortMethodText]}>사진적은순</Text>
            </TouchableOpacity>
          </View>
          </TouchableOpacity>
        </View>
    </Modal>
    </React.Fragment>
  );
  
};

const styles = StyleSheet.create({
  imgBox: {
    width: 48,
    height: 48,
    marginTop: 25,
  },

  albumTextLeft: {
    color: 'white',
    fontSize: 14,
    paddingBottom:15,
    paddingLeft:15
  },

  albumTextRight: {
    color: 'white',
    fontSize: 14,
    paddingBottom:15,
    paddingRight:15
  },

  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 999,
  },
  button: {
    backgroundColor: 'blue',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },  
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    width: '100%',
    padding: 20,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: 'gray',
    width: screenWidth - screenWidth*0.1,
    padding: 5,
    marginTop: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 10,
  },
  modalButtonCancel: {
    width: screenWidth * 0.5,
    color: 'black',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  modalButtonOk: {
    width: screenWidth * 0.5,
    color: 'blue',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight:'bold',
    marginBottom: 10,
  },
  sortMethodButton: {
    paddingVertical: 10,
  },
  sortMethodText: {
    fontSize: 14,
    color: "#222222"
  },
  closeButton: {
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  selectedSortMethod: {
    color : '#5A8FFF'
  },
  selectedSortMethodText: {
    color : '#5A8FFF'
  },
});


export default FolderList;
