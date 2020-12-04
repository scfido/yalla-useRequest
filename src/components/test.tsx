import { IUserModel } from '@/models/userModel';
import React, { useReducer } from 'react';
import { Button, Alert } from 'antd';
import { useModel } from 'umi';
import {Spin} from "antd";

export default () => {
  const app = useModel("appModel", ({ error, loading, remove }) => ({ error, loading, remove }));
  const model = useModel("userModel");
  return (
    <div>
      {<Alert type="error" message={app.error?.message} ></Alert>}
      <Spin spinning={app.loading}>
        <h1>Page index 123</h1>
        {/* <p>user: {model.data?.name}</p>
        <p>error: {model.error?.message}</p>
        <p>loading: {model.loading.toString()}</p> */}
        <p><Button onClick={() => app.remove(11)}>删除</Button></p>
      </Spin>
    </div>
  );
}
