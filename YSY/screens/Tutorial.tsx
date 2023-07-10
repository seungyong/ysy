import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Pressable,
} from 'react-native';
import AppIntroSlider from 'react-native-app-intro-slider';
import Modal from 'react-native-modal';
import * as KakaoOAuth from '@react-native-seoul/kakao-login';

import FirstTutorialSVG from '../assets/icons/tutorial_love.svg';
import SecondTutorialSVG from '../assets/icons/tutorial_album.svg';
import ThirdTutorialSVG from '../assets/icons/tutorial_place.svg';

import CustomText from '../components/CustomText';

import {
  AppToken,
  LoginOptions,
  appLogin,
  verifyLoginData,
} from '../util/login';

const { width, height } = Dimensions.get('window');
const slides = [
  {
    key: 'first',
    title: '애인과 함께',
    contents: [
      'YSY를 사용하여 애인과 함께',
      '앨범, 일정, 데이트 장소를 공유하고',
      '이야기 해보세요!',
    ],
    image: FirstTutorialSVG,
  },
  {
    key: 'second',
    title: '앨범 공유',
    contents: [
      '공용 앨범 기능을 사용하여',
      '서로의 추억을 남기고 공유해보세요!',
    ],
    image: SecondTutorialSVG,
  },
  {
    key: 'third',
    title: '데이트 장소',
    contents: [
      '추천 데이트 장소를 제공합니다.',
      '같은 데이트 장소를 가는 것보단 한 번',
      '둘러봐서 새로운 데이트 장소를 확인하세요!',
    ],
    image: ThirdTutorialSVG,
  },
];

type Item = (typeof slides)[0];

const Tutorial = () => {
  let slider: AppIntroSlider | undefined;
  const [isVisible, setIsVisible] = useState(false);

  const showModal = () => {
    setIsVisible(true);
  };
  const hideModal = () => {
    setIsVisible(false);
  };

  const renderItem = ({ item }: { item: Item }) => {
    return (
      <View style={styles.container}>
        <item.image style={styles.img} />
        <View>
          <CustomText
            size={36}
            weight="medium"
            color="#527BD2"
            style={[styles.title, styles.textCenter]}>
            {item.title}
          </CustomText>
          <View>
            {item.contents.map((content: string, idx: number) => (
              <CustomText
                size={18}
                weight="regular"
                style={styles.textCenter}
                key={idx}>
                {content}
              </CustomText>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderPagination = (activeIndex: number) => {
    return (
      <View>
        {activeIndex === 2 ? (
          <TouchableOpacity style={styles.startBtn} onPress={showModal}>
            <CustomText
              size={24}
              weight="medium"
              color="#FFFFFF"
              style={{ textAlign: 'center' }}>
              시작하기
            </CustomText>
          </TouchableOpacity>
        ) : (
          <View style={styles.dotBox}>
            {slides.length > 1 &&
              slides.map((_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.dot,
                    i === activeIndex ? styles.active : styles.none,
                    styles.mr15,
                  ]}
                  onPress={() => slider?.goToSlide(i, true)}
                />
              ))}
          </View>
        )}
      </View>
    );
  };

  const kakaoLogin = async () => {
    /**
     * {
     *    "accessToken": "OV1sjBZqeffdSBl3gkls8jRKa9n-3zzx3ClMBEJdCj11GwAAAYlAeZoh",
     *    "accessTokenExpiresAt": "2023-07-11 12:44:16",
     *    "idToken": null,
     *    "refreshToken": "jgZ5hvIJT0-GIy2HyBnibr4LIa9VbhNC1HGfJY-dCj11GwAAAYlAeZog",
     *    "refreshTokenExpiresAt": "2023-09-09 00:44:16",
     *    "scopes": ["birthday", "account_email", "profile_image", "gender", "profile_nickname"]
     * }
     */
    await KakaoOAuth.login();

    /**
     * {
     *    "ageRange": "null",
     *    "ageRangeNeedsAgreement": false,
     *    "birthday": "1126",
     *    "birthdayNeedsAgreement": false,
     *    "birthdayType": "SOLAR",
     *    "birthyear": "null",
     *    "birthyearNeedsAgreement": false,
     *    "email": "seungyong00@kakao.com",
     *    "emailNeedsAgreement": false,
     *    "gender": "MALE",
     *    "genderNeedsAgreement": false,
     *    "id": "2904977053",
     *    "isEmailValid": true,
     *    "isEmailVerified": true,
     *    "isKorean": false,
     *    "isKoreanNeedsAgreement": false,
     *    "name": "null",
     *    "nickname": "승용",
     *    "phoneNumber": "null",
     *    "phoneNumberNeedsAgreement": false,
     *    "profileImageUrl": "https://k.kakaocdn.net/dn/Y4YRS/btsiPPlUQdf/5jbfMmQk55nTOnvaTzpiR0/img_640x640.jpg",
     *    "profileNeedsAgreement": false,
     *    "thumbnailImageUrl": "https://k.kakaocdn.net/dn/Y4YRS/btsiPPlUQdf/5jbfMmQk55nTOnvaTzpiR0/img_110x110.jpg"
     * }
     */
    const profile: KakaoOAuth.KakaoProfile = await KakaoOAuth.getProfile();
    const data: LoginOptions = {
      snsId: '0001',
      email: profile.email !== 'null' ? profile.email : null,
      name: profile.nickname !== 'null' ? profile.nickname : null,
      birthday:
        profile.birthday !== 'null' && profile.birthyear !== 'null'
          ? ` ${profile.birthyear}-${profile.birthday.substring(
              0,
              2,
            )}-${profile.birthday.substring(2, 4)}`
          : null,
      phone: profile.phoneNumber !== 'null' ? profile.phoneNumber : null,
      eventNofi: false,
    };

    // false면 추가 정보 페이지로 이동
    console.log(verifyLoginData(data));

    const token: AppToken = await appLogin(data);
    // SecureStore에 저장
    console.log(token);
  };

  const naverLogin = () => {
    console.log('naver Login');
  };

  const googleLogin = () => {
    console.log('google Login');
  };

  return (
    <>
      <Modal
        isVisible={isVisible}
        onBackdropPress={hideModal}
        onBackButtonPress={hideModal}
        deviceWidth={width}
        deviceHeight={height}
        style={styles.bottomModal}>
        <View style={styles.modalBox}>
          <View style={styles.textBox}>
            <CustomText
              size={26}
              weight="medium"
              style={[styles.textCenter, styles.mb5]}>
              간편 회원가입
            </CustomText>
            <CustomText
              size={16}
              weight="regular"
              color="#999999"
              style={styles.textCenter}>
              자주 사용하는 SNS를 통해 간편하게
            </CustomText>
            <CustomText
              size={16}
              weight="regular"
              color="#999999"
              style={styles.textCenter}>
              YSY 앱 서비스를 가입하실 수 있습니다.
            </CustomText>
          </View>
          <View style={styles.loginBox}>
            <Pressable onPress={kakaoLogin}>
              <Image
                source={require('../assets/icons/kakao_login_btn.png')}
                style={styles.mb15}
              />
            </Pressable>
            <Pressable onPress={naverLogin}>
              <Image
                source={require('../assets/icons/naver_login_btn.png')}
                style={styles.mb15}
              />
            </Pressable>
            <Pressable onPress={googleLogin}>
              <Image source={require('../assets/icons/google_login_btn.png')} />
            </Pressable>
          </View>
        </View>
      </Modal>
      <AppIntroSlider
        renderItem={renderItem}
        renderPagination={renderPagination}
        data={slides}
        ref={(ref: any) => (slider = ref!)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: {
    width: 155,
    height: 155,
    marginBottom: 70,
  },
  title: {
    marginBottom: 10,
  },
  textCenter: {
    textAlign: 'center',
  },
  dotBox: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mr15: {
    marginRight: 15,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 14 / 2,
  },
  active: {
    backgroundColor: '#5A8FFF',
  },
  none: {
    backgroundColor: '#DDDDDD',
  },
  startBtn: {
    position: 'absolute',
    width: 320,
    height: 52,
    bottom: 48,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#3675FB',
    borderRadius: 10,
  },
  bottomModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalBox: {
    width: width,
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 48,
    paddingBottom: 48,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  textBox: {
    marginBottom: 35,
  },
  mb5: {
    marginBottom: 5,
  },
  mb15: {
    marginBottom: 15,
  },
  loginBox: {},
});

export default Tutorial;
