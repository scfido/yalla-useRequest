import { IUserModel } from '@/models/userModel';
import React, { useReducer } from 'react';
import { useModel } from 'umi';
import styles from './index.less';

export default () => {
  const model = useModel("userModel");
  console.log("index: "+ model.data);
  return (
    <div>
      <h1 className={styles.title}>Page index</h1>
        <p>user: {model.data?.name}</p>
        <p>error: {model.error?.message}</p>
        <p>loading: {model.loading.toString()}</p>
    </div>
  );
}
