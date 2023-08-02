import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';

import { globalStyles } from '../style/global';
import DateSearchHeader from '../components/DateSearchHeader';
import CustomText from '../components/CustomText';

import {
  getObjectData,
  removeValue,
  storeObjectData,
} from '../util/asyncStorage';

import SadSVG from '../assets/icons/sad.svg';
import DateSearchItem from '../components/DateSearchItem';

const DateSearch = () => {
  const [value, setValue] = useState<string>('');
  const [history, setHistory] = useState<string[] | null>(null);

  const onChangeText = (text: string) => {
    setValue(text);
  };

  const onSubmit = () => {
    let itemValue: string[] = [];

    if (history) {
      itemValue = [...history];

      const find = itemValue.find(text => text === value);

      if (find) {
        return;
      }

      if (history.length > 10) {
        itemValue.pop();
      }
    }

    itemValue.unshift(value);
    setHistory(itemValue);
    storeObjectData('search', itemValue);
  };

  const deleteHistory = async () => {
    const isSuccess = await removeValue('search');

    if (isSuccess) {
      setHistory(null);
    } else {
      console.log('error!');
    }
  };

  const moveDateDeatil = (text: string) => {
    console.log(text);
  };

  const getMyHistory = async () => {
    const history = await getObjectData('search');
    setHistory(history);
  };

  useEffect(() => {
    getMyHistory();
  }, []);

  return (
    <View style={globalStyles.mlmr20}>
      <DateSearchHeader onChangeText={onChangeText} onSubmit={onSubmit} />
      <View style={styles.top}>
        <CustomText size={18} weight="medium">
          최근 검색
        </CustomText>
        <Pressable onPress={deleteHistory}>
          <CustomText
            size={16}
            weight="regular"
            color={history ? '#222222' : '#DDDDDD'}>
            전체 삭제
          </CustomText>
        </Pressable>
      </View>
      {history ? (
        history.map((item, idx) => (
          <DateSearchItem key={idx} text={item} onPress={moveDateDeatil} />
        ))
      ) : (
        <View style={styles.error}>
          <SadSVG width={70} height={70} />
          <CustomText
            size={18}
            weight="regular"
            color="#CCCCCC"
            style={{ marginTop: 15 }}>
            검색 기록이 없습니다.
          </CustomText>
          <CustomText size={18} weight="regular" color="#CCCCCC">
            원하시는 장소를 검색해보세요!
          </CustomText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 5,
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DateSearch;