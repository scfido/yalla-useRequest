import { IUserModel } from '@/models/userModel';
import React, { useReducer } from 'react';
import { Button,Alert } from 'antd';
import { useModel } from 'umi';
import styles from './index.less';
import Test from "@/components/test"

export default () => {
  const app = useModel("appModel");
  const model = useModel("userModel");
  return (
    <div>
      {<Alert type="error" message={app.error?.message} ></Alert>}
      <h1 className={styles.title}>Page index</h1>
        {/* <p>user: {model.data?.name}</p>
        <p>error: {model.error?.message}</p>
        <p>loading: {model.loading.toString()}</p> */}
        <p><Button onClick={()=>model.remove(10)}>删除</Button></p>
        <br />
        <h1> test</h1>
        <Test />
    </div>
  );
}
