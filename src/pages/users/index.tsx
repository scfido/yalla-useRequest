import React from 'react';
import { useModel } from 'umi';
import EditForm from './EditForm';
import List from './List';

export default () => {
  return (
    <div>
      <h1>用户列表</h1>
      <EditForm />
      <List />
    </div>
  );
};
