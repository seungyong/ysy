import { API } from '../util/API';

export const favoriteAPI = {
  getFavorite: async () => {
    const res = await API.get('/favorite');
    console.log(res);
    return res;
  },
};
