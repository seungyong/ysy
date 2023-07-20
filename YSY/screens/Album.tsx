import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';

import SortSvg from '../assets/icons/sort.svg';
import SettingSvg from '../assets/icons/settings.svg';
import AddSvg from '../assets/icons/add.svg';
import WCheckSvg from '../assets/icons/white_check.svg';
import BCheckSvg from '../assets/icons/check.svg';
import UCheckSvg from '../assets/icons/un-check.svg';
import MergeSvg from '../assets/icons/merge.svg';
import DeleteSvg from '../assets/icons/delete.svg';
import DownloadSvg from '../assets/icons/download.svg';

import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

const screenWidth = wp('100%');

const Album = () => {
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);
  const [isAlbumModalVisible, setIsAlbumModalVisible] = useState(false);
  const [selectedSortMethod, setSelectedSortMethod] = useState('최신순');

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedAlbums, setSelectedAlbums] = useState<string[]>([]);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);

  const handleSelectAll = () => {
    if (selectedAlbums.length > 0) {
      // 이미 선택된 앨범이 있는 경우 전체 해제 동작 수행
      setSelectedAlbums([]);
    } else {
      // 선택된 앨범이 없는 경우 전체 선택 동작 수행
      setSelectedAlbums(dummyFolder);
    }
  };

  const renderHeaderRight = () => {
    if (isSelectionMode) {
      const numSelected = selectedAlbums.length;
      return (
        <View>
          <TouchableOpacity onPress={handleSelectAll}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {numSelected > 0 ? (
                <BCheckSvg style={{ marginRight: 5 }} />
              ) : (
                <UCheckSvg style={{ marginRight: 5 }} />
              )}
              <Text
                style={{
                  color: numSelected > 0 ? '#3675FB' : '#999999',
                  marginRight: 15,
                }}>
                {numSelected > 0 ? '선택 해제' : '모두 선택'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      );
    } else {
      setIsAlbumModalVisible(false);
    }

    return null;
  };

  const handleAlbumPress = (albumName: string) => {
    if (isSelectionMode) {
      setSelectedAlbums(prevSelectedAlbums => {
        if (prevSelectedAlbums.includes(albumName)) {
          // 이미 선택된 앨범인 경우 선택 해제
          return prevSelectedAlbums.filter(item => item !== albumName);
        } else {
          // 선택되지 않은 앨범인 경우 선택 추가
          return [...prevSelectedAlbums, albumName];
        }
      });
    } else {
      // 다중 선택 모드가 아닐 때는 단일 앨범을 선택하는 로직
      // 여기에 앨범을 클릭했을 때의 동작을 작성하세요
    }
  };

  const handleLongPress = (albumName: string) => {
    if (isSelectionMode === true) {
      handleSelectionCancel();
      setContextMenuVisible(false);
    } else {
      setIsSelectionMode(true);
      setIsAlbumModalVisible(false);
      setSelectedAlbums([albumName]);
      setContextMenuVisible(true);
    }
  };

  const handleSelectionCancel = () => {
    setIsSelectionMode(false);
    setSelectedAlbums([]);
  };

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

  const handleMergeAlbums = () => {
    // 선택된 앨범들을 합치는 기능 구현
    // ...
  };

  const handleDownloadAlbums = () => {
    // 선택된 앨범들을 로컬로 다운로드하는 기능 구현
    // ...
  };

  const handleDeleteAlbums = () => {
    // 선택된 앨범들을 삭제하는 기능 구현
    // ...
  };

  const handleContextMenuClose = () => {
    setIsSelectionMode(false);
    setSelectedAlbums([]);
    setContextMenuVisible(false);
  };

  const handleBackdropPress = () => {
    // Do nothing on backdrop press
  };

  const renderContextMenu = () => {
    return (
      <Modal
        visible={contextMenuVisible}
        animationType="slide"
        transparent={true}>
        <TouchableOpacity
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1} // This prevents the backdrop from being pressed
        >
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <View
              style={{
                backgroundColor: 'white',
                padding: 20,
                borderRadius: 10,
              }}>
              <TouchableOpacity onPress={handleMergeAlbums}>
                <Text>Merge Albums</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDownloadAlbums}>
                <Text>Download Albums</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleContextMenuClose}>
                <Text>Delete Albums</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderItem = ({ item }: { item: string }) => {
    const isSelected = selectedAlbums.includes(item);

    return (
      <View style={{ flex: 1, paddingTop: 5, alignItems: 'center' }}>
        <TouchableOpacity
          style={{ flex: 1, paddingTop: 5, alignItems: 'center' }}
          onPress={() => handleAlbumPress(item)}
          onLongPress={() => handleLongPress(item)}>
          <Image
            source={{ uri: item }}
            style={{ width: screenWidth, height: 200 }}
          />
          <View style={{ position: 'absolute', bottom: 0, left: 0 }}>
            <Text style={styles.albumTextLeftTitle}>앨범 이름</Text>
            <Text style={styles.albumTextLeft}>(개수)</Text>
          </View>
          <View style={{ position: 'absolute', bottom: 0, right: 0 }}>
            <Text style={styles.albumTextRight}>2023-07-18</Text>
          </View>
          {isSelectionMode && (
            <View
              style={
                isSelected ? styles.checkedCircle : styles.unCheckedCircle
              }>
              <Text>
                {isSelected ? <WCheckSvg style={styles.checked} /> : ''}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };
  const dummyFolder = [
    'https://fastly.picsum.photos/id/179/200/200.jpg?hmac=I0g6Uht7h-y3NHqWA4e2Nzrnex7m-RceP1y732tc4Lw',
    'https://fastly.picsum.photos/id/803/200/300.jpg?hmac=v-3AsAcUOG4kCDsLMlWF9_3Xa2DTODGyKLggZNvReno',
    'https://fastly.picsum.photos/id/999/200/300.jpg?hmac=XqjgMZW5yK4MjHpQJFs_TiRodRNf9UVKjJiGnDJV8GI',
    'https://fastly.picsum.photos/id/600/200/300.jpg?hmac=Ub3Deb_eQNe0Un7OyE33D79dnextn3M179L0nRkv1eg',
    'https://fastly.picsum.photos/id/193/200/300.jpg?hmac=b5ZG1TfdndbrnQ8UJbIu-ykB2PRWv0QpHwehH0pqMgE',
    'https://fastly.picsum.photos/id/341/200/300.jpg?hmac=tZpxFpS1LmFfC4e_ChqA5I8JfUfJuwH3oZvmQ58SzHc',
    'https://fastly.picsum.photos/id/387/200/300.jpg?hmac=JlKyfJE4yZ_jxmWXH5sNYl7JdDfP04DOk-hye4p_wtk',
    'https://fastly.picsum.photos/id/863/200/300.jpg?hmac=4kin1N4a7dzocUZXCwLWHewLobhw1Q6_e_9E3Iy3n0I',
  ];

  const CustomModal = ({
    isVisible,
    onClose,
    onMerge,
    onDownload,
    onDelete,
  }) => {
    if (!isVisible) {
      return null;
    }

    return (
      <View
        style={{
          flex: 1,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <View
          style={{
            backgroundColor: 'white',
            padding: 20,
            borderRadius: 10,
          }}>
          {/* 합치기 기능 */}
          <TouchableOpacity onPress={onMerge}>
            <Text>Merge Albums</Text>
          </TouchableOpacity>
          {/* 다운로드 기능 */}
          <TouchableOpacity onPress={onDownload}>
            <Text>Download Albums</Text>
          </TouchableOpacity>
          {/* 삭제 기능 */}
          <TouchableOpacity onPress={onDelete}>
            <Text>Delete Albums</Text>
          </TouchableOpacity>
        </View>
        {/* 닫기 버튼 */}
        <TouchableOpacity onPress={onClose} style={{ marginTop: 10 }}>
          <Text>Close</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <React.Fragment>
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            height: 50,
            backgroundColor: 'white',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}>
          {isSelectionMode ? (
            renderHeaderRight()
          ) : (
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                onPress={() => {
                  openSortModal();
                }}>
                <SortSvg style={styles.imgBox} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {}}>
                <SettingSvg style={styles.imgBox} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <FlatList
          data={dummyFolder}
          keyExtractor={(item, index) => String(index)}
          renderItem={renderItem}
        />

        <View style={styles.container}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setIsAddModalVisible(true)}>
            <AddSvg style={styles.addBtn} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal // 앨범 추가 Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text>앨범 추가</Text>
            <TextInput
              style={styles.input}
              onChangeText={() => {}}
              value={''}
            />
            <View style={styles.buttonContainer}>
              <Text
                style={styles.modalButtonCancel}
                onPress={() => setIsAddModalVisible(false)}>
                취소
              </Text>
              <Text>|</Text>
              <Text
                style={styles.modalButtonOk}
                onPress={() => setIsAddModalVisible(false)}>
                추가
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      <Modal // 정렬 Modal
        visible={isSortModalVisible}
        animationType="slide"
        transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>정렬</Text>
            <TouchableOpacity
              style={[styles.sortMethodButton]}
              onPress={() => handleSortMethodSelect('최신순')}>
              <Text
                style={[
                  styles.sortMethodText,
                  selectedSortMethod === '최신순' &&
                    styles.selectedSortMethodText,
                ]}>
                최신순
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortMethodButton]}
              onPress={() => handleSortMethodSelect('오래된순')}>
              <Text
                style={[
                  styles.sortMethodText,
                  selectedSortMethod === '오래된순' &&
                    styles.selectedSortMethodText,
                ]}>
                오래된순
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortMethodButton]}
              onPress={() => handleSortMethodSelect('제목순')}>
              <Text
                style={[
                  styles.sortMethodText,
                  selectedSortMethod === '제목순' &&
                    styles.selectedSortMethodText,
                ]}>
                제목순
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortMethodButton]}
              onPress={() => handleSortMethodSelect('사진많은순')}>
              <Text
                style={[
                  styles.sortMethodText,
                  selectedSortMethod === '사진많은순' &&
                    styles.selectedSortMethodText,
                ]}>
                사진많은순
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortMethodButton]}
              onPress={() => handleSortMethodSelect('사진적은순')}>
              <Text
                style={[
                  styles.sortMethodText,
                  selectedSortMethod === '사진적은순' &&
                    styles.selectedSortMethodText,
                ]}>
                사진적은순
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal // 앨범 다중선택 처리 Modal
        visible={isAlbumModalVisible}
        animationType="none"
        transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.sortMethodButton]}
                onPress={() => setIsAlbumModalVisible(false)}>
                <MergeSvg />
              </TouchableOpacity>
              <DownloadSvg />
              <DeleteSvg />
            </View>
          </View>
        </View>
      </Modal>
      <CustomModal
        isVisible={contextMenuVisible}
        onClose={handleContextMenuClose}
        onMerge={() => {
          // 합치기 기능 처리
        }}
        onDownload={() => {
          // 다운로드 기능 처리
        }}
        onDelete={() => {
          // 삭제 기능 처리
        }}
      />
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  imgBox: {
    width: 48,
    height: 48,
    marginTop: 25,
  },

  albumTextLeftTitle: {
    color: 'white',
    fontSize: 18,
    paddingLeft: 15,
    fontWeight: 'bold',
  },

  albumTextLeft: {
    color: 'white',
    fontSize: 14,
    paddingBottom: 15,
    paddingLeft: 15,
  },

  albumTextRight: {
    color: 'white',
    fontSize: 14,
    paddingBottom: 15,
    paddingRight: 15,
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
  addBtn: {
    width: 48,
    height: 48,
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
    width: screenWidth - screenWidth * 0.1,
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
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sortMethodButton: {
    paddingVertical: 10,
  },
  sortMethodText: {
    fontSize: 14,
    color: '#222222',
  },
  closeButton: {
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  selectedSortMethodText: {
    color: '#5A8FFF',
  },
  checkedCircle: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: '#3675FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    marginRight: 20,
  },
  unCheckedCircle: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: '#FFFFFF99',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    marginRight: 20,
  },
  checked: {
    width: 48,
    height: 48,
  },
});

export default Album;
