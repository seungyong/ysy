import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { isSameDay } from 'date-fns';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import CalendarHeader from './CalendarHeader';

import SadSvg from '../assets/icons/sad.svg';

import BackSvg from '../assets/icons/back.svg';
import Input from './Input';
import DatePicker from './DatePicker';
import ColorPicker from './ColorPicker';
import { userAPI } from '../apis/userAPI';
import { calendarAPI } from '../apis/calendarAPI';
import { fromHsv } from 'react-native-color-picker';
import { HsvColor } from 'react-native-color-picker/dist/typeHelpers';

const screenWidth = wp('100%');
const screenHeight = hp('100%');

interface CalendarProps {
  onDateSelect: (date: Date) => void;
}

type Schedule = {
  calendarId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  hl: string;
  title: string;
  desc: string;
  color: string;
};

const MyCalendar: React.FC<CalendarProps> = ({ onDateSelect }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // 현재
  const [showDetailView, setShowDetailView] = useState(false);
  const [dateCellFlex, setDateCellFlex] = useState(false);
  const [scheduleList, setScheduleList] = useState<Schedule[]>([]);
  const [selectedScheduleList, setSelectedScheduleList] = useState<Schedule[]>(
    [],
  );
  const [addScheVisible, setAddScheVisible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<number>(
    new Date().getMonth(),
  );
  const [currentYear, setCurrentYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [inputTitle, setInputTitle] = useState('');
  const [inputDesc, setInputDesc] = useState('');
  const [inputStartDate, setInputStartDate] = useState('');
  const [inputEndDate, setInputEndDate] = useState('');
  const [inputColor, setInputColor] = useState('');
  const [isAdd, setIsAdd] = useState(false);
  const [isDeleteModal, setIsDeleteModal] = useState(false);
  const [deleteSchedule, setDeleteSchedule] = useState('');
  const [swipeStart, setSwipeStart] = useState(0);
  const [schFlag, setSchFlag] = useState(true);

  const [cupId, setCupId] = useState('');
  const today = new Date();

  const handlePrevMonth = () => {
    if (currentMonth <= 0) {
      setCurrentYear(currentYear - 1);
    }
    setCurrentMonth(prevMonth => (prevMonth === 0 ? 11 : prevMonth - 1));
    setSchFlag(true);
    getSchedule();
    getMonthDates(currentYear, currentMonth);
  };

  const handleNextMonth = () => {
    if (currentMonth >= 11) {
      setCurrentYear(currentYear + 1);
    }
    setCurrentMonth(prevMonth => (prevMonth === 11 ? 0 : prevMonth + 1));
    setSchFlag(true);
    getSchedule();
    getMonthDates(currentYear, currentMonth);
  };

  const handleDateSelect = (date: Date) => {
    if (isSameDay(selectedDate, date)) {
      setDateCellFlex(!dateCellFlex);
      setShowDetailView(!showDetailView);
      filterSchedule();
    } else {
      if (dateCellFlex && showDetailView) {
        setDateCellFlex(!dateCellFlex);
        setShowDetailView(!showDetailView);
      }
      if (isSameMonth(date, currentMonth) && isSameYear(date, currentYear)) {
        setSelectedDate(date);
        onDateSelect(date);
      } else {
        if (currentMonth == 11 && date.getMonth() === 0) {
          setCurrentYear(currentYear + 1);
        }
        if (currentMonth == 0 && date.getMonth() === 11) {
          setCurrentYear(currentYear - 1);
        }
        setCurrentMonth(date.getMonth());
      }
    }
  };

  const isSameMonth = (date1: Date, date2: number) => {
    return date1.getMonth() === date2;
  };
  const isSameYear = (date1: Date, date2: number) => {
    return date1.getFullYear() === date2;
  };
  const getSchedule = async () => {
    let response;

    if (!cupId) {
      const userData = JSON.stringify(await userAPI.getUserMe()); // login 정보 가져오기
      const userParsedData = JSON.parse(userData);
      setCupId(userParsedData.cupId);
      response = await calendarAPI.getSchedule(
        userParsedData.cupId,
        currentYear,
      );
    } else {
      response = await calendarAPI.getSchedule(cupId, currentYear);
    }

    const newScheduleList = [];

    for (const item of response) {
      let diff = new Date(item.toDate) - new Date(item.fromDate);
      const day = Math.floor(diff / (1000 * 60 * 60 * 24));
      diff = Math.floor(diff % (1000 * 60 * 60 * 24));
      const hour = Math.floor(diff / (1000 * 60 * 60));
      diff = Math.floor(diff % (1000 * 60 * 60));
      const min = Math.floor(diff / (1000 * 60));

      let hl;
      if (day > 0) {
        hl = `${day}일 ${hour}시간 ${min}분`;
      } else if (hour <= 0) {
        hl = `${min}분`;
      } else {
        hl = `${hour}시간 ${min}분`;
      }
      const newScheduleItem = {
        calendarId: item.calendarId,
        startDate: item.fromDate.slice(0, 10),
        endDate: item.toDate.slice(0, 10),
        startTime: item.fromDate.slice(11, 16),
        endTime: item.toDate.slice(11, 16),
        hl: hl,
        title: item.title,
        desc: item.description,
        color: item.color,
      };

      newScheduleList.push(newScheduleItem);
    }

    setScheduleList(newScheduleList);
  };

  const getMonthDates = (year: number, month: number): Date[] => {
    if (scheduleList.length <= 0 && schFlag) {
      getSchedule();
      setSchFlag(false);
    }

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    const startDayOfWeek = firstDay.getDay();
    const endDayOfWeek = lastDay.getDay();

    // 이전 달의 마지막 날들을 추가
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push(date);
    }

    for (
      let date = new Date(firstDay);
      date <= lastDay;
      date.setDate(date.getDate() + 1)
    ) {
      days.push(new Date(date));
    }

    let nextMonthDay = 1;
    for (let i = endDayOfWeek + 1; days.length < 42; i++) {
      const date = new Date(year, month + 1, nextMonthDay);
      days.push(date);
      nextMonthDay++;
    }

    return days;
  };

  // 각 요일의 이름을 배열로 정의
  const dayOfWeekLabels = ['일', '월', '화', '수', '목', '금', '토'];

  // 현재 달의 첫 번째 날의 요일을 구하는 함수
  const getFirstDayOfWeek = (year: number, month: number): number => {
    return new Date(year, month, 2).getDay();
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getEmptyCellsCount = () => {
    const firstDayOfWeek = getFirstDayOfWeek(currentYear, currentMonth);
    return firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  };

  const divideArray = (arr: Date[], size: number) => {
    const dividedArray = [];
    for (let i = 0; i < arr.length; i += size) {
      dividedArray.push(arr.slice(i, i + size));
    }
    return dividedArray;
  };

  const currentMonthDates = getMonthDates(currentYear, currentMonth);

  // const adjustedDates = [
  //   ...Array(getEmptyCellsCount()).fill(null),
  //   ...currentMonthDates,
  // ];

  const dividedDates = divideArray(currentMonthDates, 7);

  const filterSchedule = () => {
    // const newSchedule = scheduleList.filter(
    //   item => item.startDate === selectedDate.toISOString().slice(0, 10),
    // );
    const newSchedule = scheduleList.filter(item =>
      isDateBetween(
        item.startDate,
        item.endDate,
        selectedDate.toISOString().slice(0, 10),
      ),
    );
    setSelectedScheduleList(newSchedule);
  };

  const drawCircle = (color: string) => {
    return (
      <View
        style={{
          width: '2%', // 원의 너비
          height: 8, // 원의 높이
          borderRadius: 5, // 반지름 값의 절반으로 원이 됨
          backgroundColor: color, // 특정 색상
          marginRight: '1%',
        }}
      />
    );
  };

  const isDateBetween = (
    startDateStr: string,
    endDateStr: string,
    targetDateStr: string,
  ) => {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    const targetDate = new Date(targetDateStr);
    // targetDate가 startDate와 endDate 사이에 있는지 검사
    return startDate <= targetDate && targetDate <= endDate;
  };

  const drawBar = (day: Date) => {
    const filtedSchedule = scheduleList.filter(item =>
      isDateBetween(
        item.startDate,
        item.endDate,
        day.toISOString().slice(0, 10),
      ),
    );

    let totalBarHeight;
    if (showDetailView) {
      totalBarHeight = screenHeight * 0.02;
    } else {
      totalBarHeight = screenHeight * 0.08;
    }
    return (
      <View
        style={{
          width: '115%', // 100%
          height: totalBarHeight,
        }}>
        <FlatList
          data={filtedSchedule}
          keyExtractor={(item, index) => String(index)}
          renderItem={({ item }) => RenderBar(item, day)}
          scrollEnabled={false}
        />
      </View>
    );
  };

  const RenderBar = (schedule: Schedule, day: Date) => {
    const eventDay =
      parseInt(schedule.endDate.toString().slice(8, 10), 10) -
      parseInt(schedule.startDate.toString().slice(8, 10), 10);
    const dayOfWeek = day.getDay();
    const lastDayFlag =
      parseInt(schedule.endDate.toString().slice(8, 10)) == day.getDate();

    return (
      <View
        style={{
          width: `${
            eventDay ? (dayOfWeek != 6 ? (lastDayFlag ? 90 : 110) : 90) : 90
          }%`,
          height: 8,
          backgroundColor: schedule.color,
          // marginRight: '70%',
          marginTop: 5,
          borderRadius: 5,
        }}
      />
    );
  };

  const RenderSchecule = (schedule: Schedule) => {
    return (
      <View
        style={{
          flex: 1,
          width: screenWidth * 1,
          height: screenHeight * 0.1,
          marginBottom: 5,
          alignItems: 'center',
          justifyContent: 'flex-start',
          flexDirection: 'row',
        }}>
        <View
          style={{
            width: screenWidth * 0.2,
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{ fontSize: 18 }}>{schedule.startTime}</Text>
          <Text style={{ fontSize: 12 }}>{schedule.hl}</Text>
        </View>
        <View
          style={{
            width: '70%',
            height: '100%',
            alignItems: 'flex-start',
            justifyContent: 'center',
            marginLeft: '6%',
            borderBottomColor: '#CCCCCC',
            borderBottomWidth: 1,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {drawCircle(schedule.color)}
            <Pressable
              onLongPress={() => {
                setIsDeleteModal(true);
                setDeleteSchedule(schedule.calendarId);
              }}>
              <Text style={{ fontSize: 18, justifyContent: 'center' }}>
                {schedule.title}
              </Text>
            </Pressable>
          </View>
          <Text style={{ paddingLeft: '3.5%', fontSize: 12 }}>
            {schedule.desc}
          </Text>
        </View>
      </View>
    );
  };

  const handleTitle = (text: string) => {
    setInputTitle(text);
    checkEmpty();
  };

  const handleDesc = (text: string) => {
    setInputDesc(text);
    checkEmpty();
  };

  const handleSD = (text: string) => {
    setInputStartDate(text);
    checkEmpty();
  };

  const handleED = (text: string) => {
    setInputEndDate(text);
    checkEmpty();
  };

  const handleColor = async (color: HsvColor) => {
    setInputColor(fromHsv(color));
    checkEmpty();
  };

  const checkEmpty = () => {
    if (inputTitle && inputDesc && inputStartDate && inputEndDate) {
      setIsAdd(true);
    } else {
      setIsAdd(false);
    }
  };
  const handleAdd = async () => {
    if (isAdd) {
      const userData = JSON.stringify(await userAPI.getUserMe()); // login 정보 가져오기
      const userParsedData = JSON.parse(userData);

      const data = {
        title: inputTitle,
        description: inputDesc,
        fromDate: inputStartDate,
        toDate: inputEndDate,
        color: inputColor,
      };

      await calendarAPI.postSchedule(userParsedData.cupId, data);
      setAddScheVisible(false);
      await getSchedule();
    }
  };

  const swipeEvent = (diff: number) => {
    if (diff > 100) {
      handlePrevMonth();
    } else if (diff < -100) {
      handleNextMonth();
    }
  };

  return (
    <React.Fragment>
      <View
        style={{
          flexDirection: 'row',
          height: 48,
          backgroundColor: 'white',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}>
        <CalendarHeader openAddModal={() => setAddScheVisible(true)} />
      </View>
      <View style={styles.container}>
        <View style={{ flex: 1 }}>
          <View style={styles.titleContainer}>
            {/* 선택된 달과 년도 표시 */}
            <Text style={styles.title}>{currentMonth + 1 + '월'}</Text>
          </View>

          {/* 달력의 날짜들 */}
          <View style={styles.calendarContainer}>
            {/* 요일 표시 월화수목금토일*/}
            <View style={styles.weekLabelsContainer}>
              {dayOfWeekLabels.map((label, index) => (
                <Text
                  key={index}
                  style={[
                    styles.dayOfWeekLabel,
                    index === 0 && { color: '#FB3838' },
                    index === 6 && { color: '#0066FF' },
                  ]}>
                  {label}
                </Text>
              ))}
            </View>

            {dividedDates.map((week, index) => (
              <View key={index} style={styles.weekContainer}>
                {week.map((date, subIndex) =>
                  date ? (
                    <Pressable
                      onTouchStart={async e => {
                        await setSwipeStart(e.nativeEvent.pageX);
                      }}
                      onTouchEnd={async e => {
                        const end = e.nativeEvent.pageX;
                        const diff = end - swipeStart;
                        swipeEvent(diff);
                      }}
                      key={date.toString()}
                      onPress={() => handleDateSelect(date)}
                      style={[
                        dateCellFlex ? styles.dateCellFlex : styles.dateCell,
                        isSameDay(date, selectedDate) &&
                          styles.selectedDateCell,
                        isSameDay(date, today) && styles.todayCell,
                        !isSameMonth(date, currentMonth) &&
                          styles.prevNextMonthDateCell,
                      ]}>
                      <Text
                        style={[
                          {
                            color: '#333333',
                            fontWeight: 'bold',
                            alignSelf: 'center',
                          },
                          date.getDay() === 0 && styles.sundayCell, // 일요일의 스타일
                          date.getDay() === 6 && styles.saturdayCell, // 토요일의 스타일
                          isSameDay(date, selectedDate) &&
                            styles.selectedDateText,
                        ]}>
                        {date.getDate()}
                      </Text>
                      <View
                        style={{
                          overflow: 'visible',
                        }}>
                        {drawBar(date)}
                      </View>
                    </Pressable>
                  ) : (
                    <View key={subIndex} style={styles.dateCell} />
                  ),
                )}
              </View>
            ))}
          </View>
        </View>

        {showDetailView && (
          <View style={styles.flexibleSpace}>
            <View style={styles.detailView}>
              {selectedScheduleList.length <= 0 ? (
                <>
                  <SadSvg style={styles.sadStyle} />
                  <Text style={styles.noneScheText}>
                    일정이 없어요.{'\n'}일정을 추가해주세요!
                  </Text>
                </>
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <View
                    style={{
                      width: screenWidth * 0.9,
                      height: '5%',
                      alignItems: 'flex-start',
                      justifyContent: 'center',
                      borderBottomWidth: 1,
                      borderColor: '#cccccc',
                    }}>
                    <Text>{selectedDate.toDateString()}</Text>
                  </View>
                  <FlatList
                    data={selectedScheduleList}
                    keyExtractor={(item, index) => String(index)}
                    renderItem={({ item }) => RenderSchecule(item)}
                  />
                </View>
              )}
            </View>
          </View>
        )}
      </View>
      <Modal // 앨범 합치기
        visible={addScheVisible}
        animationType="slide"
        transparent={true}>
        <View
          style={{
            flex: 1,
            paddingLeft: 20,
            paddingRight: 20,
            backgroundColor: 'white',
          }}>
          <View
            style={{
              flexDirection: 'row',
              height: 48,
              backgroundColor: 'white',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <BackSvg onPress={() => setAddScheVisible(false)} height={100} />
            <Pressable onPress={handleAdd}>
              <Text
                style={
                  isAdd
                    ? { fontSize: 18, color: '#3675FB' }
                    : { fontSize: 18, color: '#CCCCCC' }
                }>
                추가
              </Text>
            </Pressable>
          </View>
          <View
            style={{
              backgroundColor: 'white',
            }}>
            <View
              style={{
                alignItems: 'flex-start',
                marginTop: 25,
                marginBottom: 40,
              }}>
              <Text
                style={{
                  color: '#222222',
                  fontWeight: 'bold',
                  fontSize: 24,
                  marginBottom: 5,
                }}>
                일정 추가
              </Text>
              <Text
                style={{
                  color: '#CCCCCC',
                  fontWeight: 'bold',
                  fontSize: 16,
                }}>
                새로운 일정을 추가합니다.{'\n'}연인과 함께 또는 공유하는 일정을
                추가해주세요!
              </Text>
            </View>
            <View
              style={{
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
              }}>
              <View style={{ width: '100%' }}>
                <Input
                  onInputChange={handleTitle}
                  maxLength={12}
                  placeholder={'제목'}
                />
              </View>
              <View style={{ width: '100%', height: 180 }}>
                <Input
                  onInputChange={handleDesc}
                  textAlignVertical="top"
                  multipleLine={true}
                  maxLength={50}
                  placeholder={'설명s'}
                />
              </View>
              <View style={{ width: '100%' }}>
                <DatePicker
                  mode={'datetime'}
                  onInputChange={handleSD}
                  placeholder={'시작 날짜'}
                />
              </View>
              <View style={{ width: '100%' }}>
                <DatePicker
                  onInputChange={handleED}
                  mode={'datetime'}
                  // minimumDate={true}
                  minimumDateValue={new Date(inputStartDate)}
                  placeholder={'종료 날짜'}
                />
              </View>
              <View
                style={{
                  width: '100%',
                  height: '100%',
                }}>
                <ColorPicker
                  onColorChange={handleColor}
                  placeholder={'#00FF00'}
                  defaultValue="#00FF00"
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal // 스케줄 삭제
        visible={isDeleteModal}
        animationType="slide"
        transparent={true}>
        <TouchableWithoutFeedback
          onPress={() => {
            setIsDeleteModal(false);
          }}>
          <View
            style={{
              flex: 1,
              justifyContent: 'flex-end',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.0)',
            }}>
            <View
              style={{
                backgroundColor: 'lightgray',
                width: '100%',
                padding: 20,
                borderRadius: 15,
                borderColor: 'black',
              }}>
              <Text style={{ textAlign: 'center' }}>
                해당 스케줄을 삭제하시겠습니까?
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-evenly',
                  marginTop: 20,
                }}>
                <Text onPress={() => setIsDeleteModal(false)}>취소</Text>
                <Text>|</Text>
                <Text
                  onPress={async () => {
                    await calendarAPI.deleteSchedule(cupId, deleteSchedule);
                    await getMonthDates(currentYear, currentMonth);
                    await getSchedule();
                    setIsDeleteModal(false);
                    setShowDetailView(!showDetailView);
                    setDateCellFlex(!dateCellFlex);
                  }}>
                  삭제
                </Text>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  calendarContainer: {
    flex: 2, // 활성화 여부에 따라 flex 값 변경
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    paddingHorizontal: 10,
    backgroundColor: 'white', // 배경색 변경
  },
  dateCell: {
    width: screenWidth * 0.12,
    height: screenHeight * 0.1,
    marginBottom: screenHeight * 0.02,
    justifyContent: 'flex-start',
  },
  dateCellFlex: {
    width: screenWidth * 0.12,
    height: screenHeight * 0.04,
    marginBottom: screenHeight * 0.02,
    justifyContent: 'flex-start',
  },
  selectedDateCell: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 2,
    borderRadius: 10,
    borderColor: 'gray',
  },
  selectedDateText: {
    color: 'white',
    fontWeight: 'bold',
    backgroundColor: '#0066FF',
    borderRadius: 3,
    shadowOpacity: 0.5,
  },
  todayCell: {
    borderRadius: 10,
  },
  weekLabelsContainer: {
    flexDirection: 'row',
    width: '100%',
    borderBottomWidth: 1,
    borderColor: '#3333334D',
    height: screenHeight * 0.03,
    justifyContent: 'space-between',
    marginTop: 10,
    backgroundColor: 'white', // 배경색 변경
  },
  dayOfWeekLabel: {
    fontSize: 10,
    color: '#333333',
    width: screenWidth * 0.12,
    margin: 1,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  weekContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    backgroundColor: 'white', // 배경색 변경
  },
  prevNextMonthDateCell: {
    width: screenWidth * 0.12,
    marginBottom: screenHeight * 0.02,
    opacity: 0.4, // 회색으로 처리하기 위한 투명도 설정
  },
  selectedPrevNextMonthDateCell: {
    backgroundColor: 'blue', // 선택된 날짜의 스타일
    opacity: 1, // 선택된 날짜는 투명도를 원래대로 설정
  },
  sundayCell: {
    color: '#FB3838', // 일요일 색상
  },
  saturdayCell: {
    color: '#0066FF', // 토요일 색상
  },
  flexibleSpace: {
    flex: 1,
    width: screenWidth * 1,
  },

  detailView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: screenHeight * 1,
  },
  sadStyle: {
    marginBottom: 10,
    width: 48,
  },
  noneScheText: {
    color: '#CCCCCC',
    textAlign: 'center',
    fontSize: 18,
  },
  circle: {
    width: '2%', // 원의 너비
    height: 8, // 원의 높이
    borderRadius: 5, // 반지름 값의 절반으로 원이 됨
    backgroundColor: 'blue', // 특정 색상
    marginRight: '1%',
  },
});

export default MyCalendar;
