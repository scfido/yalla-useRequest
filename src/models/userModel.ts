import { request, useRequest } from '@/abpRequest';
// import useRequest from '@ahooksjs/use-request';
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
  editorLoading: boolean;
  editorSaving: boolean;
  editorError?: Error;

  fetch(id: string): Promise<IUser>;
  create(data: IUser): Promise<boolean>;
  update(id: string, data: IUser): Promise<boolean>;
  remove(id: string): void;
  users?: IUser[];
  error?: Error;
  loading: boolean;
}

export default (): IUserModel => {
  // 加载列表
  const { data: users, error, loading } = useRequest('/api/users',
    {
      manual: false,
      initialData: [],
      onError: (e: Error) => {
        // return true; //不显示错误通知
      },
    },
  );

  // 获取编辑数据
  const getRequest = useRequest('/api/users/:id', { onError: () => true });

  // 创建
  const createRequest = useRequest(
    { url: '/api/users/:id', method: 'POST' }, { onError: () => true }
  );

  // 更新
  const updateRequest = useRequest(
    { url: '/api/users/:id', method: 'PUT' }, { onError: () => true }
  );

  const fetch = async (id: string) => {
    return getRequest.run({ id });
  };

  const remove = async (id: string) => {
    await request.delete(`/api/users/${id}`);
  };

  const create = async (data: IUser) => {
    return createRequest.run({ data });
  };

  const update = async (id: string, data: IUser) => {
    return updateRequest.run({ id, data });
  };


  return {
    editorLoading: getRequest.loading,
    editorSaving: updateRequest.loading || createRequest.loading,
    editorError: getRequest.error || updateRequest.error || createRequest.error,
    fetch,
    create,
    update,
    remove,
    users,
    error,
    loading,
  };
};
