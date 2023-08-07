import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { isSameDay } from 'date-fns';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

const screenWidth = wp('100%');
const screenHeight = hp('100%');

interface CalendarProps {
  onDateSelect: (date: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({ onDateSelect }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // 현재
  const [currentMonth, setCurrentMonth] = useState<number>(
    new Date().getMonth(),
  );
  const [currentYear, setCurrentYear] = useState<number>(
    new Date().getFullYear(),
  );

  const today = new Date();

  const handlePrevMonth = () => {
    if (currentMonth <= 0) {
      setCurrentYear(currentYear - 1);
    }
    setCurrentMonth(prevMonth => (prevMonth === 0 ? 11 : prevMonth - 1));
    getMonthDates(currentYear, currentMonth);
  };

  const handleNextMonth = () => {
    if (currentMonth >= 11) {
      setCurrentYear(currentYear + 1);
    }
    setCurrentMonth(prevMonth => (prevMonth === 11 ? 0 : prevMonth + 1));
    getMonthDates(currentYear, currentMonth);
  };

  const handleDateSelect = (date: Date) => {
    if (isSameMonth(date, currentMonth) && isSameYear(date, currentYear)) {
      console.log(date.getMonth() + ' :: ' + today.getMonth());
      setSelectedDate(date);
      onDateSelect(date);
    } else {
      if (currentMonth == 11 && date.getMonth() == 0)
        setCurrentYear(currentYear + 1);
      if (currentMonth == 0 && date.getMonth() == 11)
        setCurrentYear(currentYear - 1);
      setCurrentMonth(date.getMonth());
    }
  };

  const isSameMonth = (date1: Date, date2: number) => {
    return date1.getMonth() === date2;
  };
  const isSameYear = (date1: Date, date2: number) => {
    return date1.getFullYear() === date2;
  };

  const getMonthDates = (year: number, month: number): Date[] => {
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

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        {/* 이전 달로 이동하는 버튼 */}
        <TouchableOpacity onPress={handlePrevMonth}>
          <Text style={styles.button}>Prev</Text>
        </TouchableOpacity>

        {/* 선택된 달과 년도 표시 */}
        <Text style={styles.title}>
          {currentYear + ' ' + (currentMonth + 1)}
        </Text>

        {/* 다음 달로 이동하는 버튼 */}
        <TouchableOpacity onPress={handleNextMonth}>
          <Text style={styles.button}>Next</Text>
        </TouchableOpacity>
      </View>

      {/* 달력의 날짜들 */}
      <View style={styles.calendarContainer}>
        {/* 요일 표시 */}
        <View style={styles.weekLabelsContainer}>
          {dayOfWeekLabels.map((label, index) => (
            <Text
              key={index}
              style={[
                styles.dayOfWeekLabel,
                index == 0 && { color: '#FB3838' },
                index == 6 && { color: '#0066FF' },
              ]}>
              {label}
            </Text>
          ))}
        </View>
        {dividedDates.map((week, index) => (
          <View key={index} style={styles.weekContainer}>
            {week.map((date, subIndex) =>
              date ? (
                <TouchableOpacity
                  key={date.toString()}
                  onPress={() => handleDateSelect(date)}
                  style={[
                    styles.dateCell,
                    isSameDay(date, selectedDate) && styles.selectedDateCell,
                    isSameDay(date, today) && styles.todayCell,
                    !isSameMonth(date, currentMonth) &&
                      styles.prevNextMonthDateCell,
                  ]}>
                  <Text
                    style={[
                      isSameDay(date, selectedDate) && styles.selectedDateText,
                      date.getDay() === 0 && styles.sundayCell, // 일요일의 스타일
                      date.getDay() === 6 && styles.saturdayCell, // 토요일의 스타일
                    ]}>
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View key={subIndex} style={styles.dateCell} />
              ),
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  button: {
    fontSize: 16,
    color: 'blue',
  },
  titleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  dateCell: {
    width: screenWidth * 0.12,
    height: screenHeight * 0.07,
    marginBottom: screenHeight * 0.05,
    alignItems: 'center',
    justifyContent: 'flex-start',
    margin: 2,
  },
  selectedDateCell: {
    borderWidth: 1,
    borderRadius: 10,
    borderColor: 'gray',
  },
  selectedDateText: {
    color: 'white',
    fontWeight: 'bold',
    backgroundColor: '#0066FF',
    shadowOpacity: 0.5,
  },
  todayCell: {
    backgroundColor: 'green',
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
  },
  dayOfWeekLabel: {
    fontSize: 16,
    width: screenWidth * 0.12,
    margin: 2,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  weekContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  prevNextMonthDateCell: {
    width: screenWidth * 0.12,
    height: screenHeight * 0.07,
    marginBottom: screenHeight * 0.05,
    margin: 2,
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
});

export default Calendar;
