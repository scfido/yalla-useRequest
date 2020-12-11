import { request, useRequest } from '@/abpRequest';
import { history } from 'umi';
import { useState } from 'react';

export interface IUser {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  address: string;
  tags: string[];
}

export interface IUserModel {
  loading: boolean;
  users?: IUser[];
  error?: Error;

  editorLoading: boolean;
  editorSaving: boolean;
  editorError?: Error;

  fetch(id: string): Promise<IUser>;
  create(data: IUser): Promise<boolean>;
  update(id: string, data: IUser): Promise<boolean>;
  remove(id: string): void;

  goHome(): void;
}

export default (): IUserModel => {

  // 加载列表
  const fetchList = useRequest('/api/users',
    {
      manual: false,
      initialData: [],
      enableErrorNotification: true,
    },
  );

  // 获取单个数据
  const fetchRequest = useRequest('/api/users/:id');

  // 创建
  const createRequest = useRequest(
    { url: '/api/users/:id', method: 'POST' }
  );

  // 更新
  const updateRequest = useRequest(
    { url: '/api/users/:id', method: 'PUT' }
  );

  const fetch = async (id: string) => {
    return fetchRequest.run({ id });
  };

  const remove = async (id: string) => {
    // 删除操作业务简单，就直接使用request发起请求
    await request.delete(`/api/users/${id}`);
    await fetchList.refresh();

    return true;
  };

  const create = async (data: IUser) => {
    await createRequest.run({ data });
    await fetchList.refresh();

    return true;
  };

  const update = async (id: string, data: IUser) => {
    await updateRequest.run({ id, data });
    await fetchList.refresh();

    return true;
  };

  const goHome = (replace = true) => {
    history.replace("/users");
  }

  return {
    loading: fetchList.loading,
    users: fetchList.data,
    error: fetchList.error,

    editorLoading: fetchRequest.loading,
    editorSaving: updateRequest.loading || createRequest.loading,
    editorError: fetchRequest.error || updateRequest.error || createRequest.error,

    fetch,
    create,
    update,
    remove,

    goHome,
  };
};
