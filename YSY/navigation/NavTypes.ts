import { User } from '../types/user';
import { LoginOptions } from '../util/login';

export type TutorialNavType = {
  Tutorial: undefined;
  ConnectCouple: {
    myCode: string;
    otherCode?: string;
  };
  AdditionalInformation: {
    info: LoginOptions;
  };
};

export type DateNavType = {
  Date: undefined;
  DateSearch: undefined;
  DateSearchResult: {
    keyword: string;
  };
  DateDetail: {
    dateId: number;
  };
};

export type SettingsNavType = {
  Album: undefined;
  Date: undefined;
  Settings: undefined;
  Profile: {
    user: User;
  };
  EditProfile: {
    user: User;
  };
  Notice: undefined;
  ServiceCenter: undefined;
  Alram: undefined;
  Location: undefined;
  TermsOfUse: undefined;
  TermsOfPrivacyPolicy: undefined;
};
