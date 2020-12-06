import { request } from '@/abpRequest';
import useRequest from '@ahooksjs/use-request';
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
  editorVisible: boolean;
  editorError?: Error;
  hideEditor(): void;

  add(): void;
  edit(id: string): void;
  remove(id: string): void;
  users?: IUser[];
  error?: Error;
  loading: boolean;
}

export default (): IUserModel => {
  const [editorVisible, setEditorVisible] = useState(false);
  const { data: users, error, loading } = useRequest<IUser[]>('/api/users', {
    initialData: [],
    onError: (e: Error) => {
      //console.log("外部onError: ", e.message);
      //throw new Error("新错误")
      //return true;
    },
  });

  const getRequest = useRequest<IUser>('/api/users/:id', {
    manual: true,
  });
  const { data: user, error: editorError, loading: editorLoading } = getRequest;

  const saveRequest = useRequest<IUser>(
    { url: '/api/users/:id', method: 'POST' },
    {
      manual: true,
    },
  );

  const updateRequest = useRequest<IUser>(
    { url: '/api/users/:id', method: 'PUT' },
    {
      manual: true,
    },
  );

  console.log('users: ' + users?.length);

  const hideEditor = () => {
    setEditorVisible(false);
  };

  const add = () => {
    setEditorVisible(true);
  };

  const edit = (id: string) => {
    setEditorVisible(true);
    getRequest.run({ id });
  };

  const remove = (id: string) => {
    request.delete(`/users/${id}`);
  };

  return {
    editorLoading: getRequest.loading,
    editorSaving: updateRequest.loading || saveRequest.loading,
    editorError: getRequest.error || updateRequest.error || saveRequest.error,
    editorVisible,
    hideEditor,
    add,
    edit,
    remove,
    users,
    error,
    loading,
  };
};
