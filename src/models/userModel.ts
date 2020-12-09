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
  const { data: users, error, loading } = useRequest<IUser[]>('/api/users',
    {
      manual: false,
      initialData: [],
      onError: (e: Error) => {
        console.log("外部onError: ", e.message);
        // return true;
      },
    },
  );

  const getRequest = useRequest<IUser>('/api/users/:id');
  const { data: user, error: editorError, loading: editorLoading } = getRequest;

  const createRequest = useRequest<IUser>(
    { url: '/api/users/:id', method: 'POST' }
  );

  const updateRequest = useRequest<IUser>(
    { url: '/api/users/:id', method: 'PUT' },
  );

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

  const remove = async (id: string) => {
    await request.delete(`/api/users/${id}`);
  };

  const save = async (user: IUser, create: boolean) => {
    if (create)
      createRequest.run(user);
    else
      updateRequest.run(user);
  };


  return {
    editorLoading: getRequest.loading,
    editorSaving: updateRequest.loading || createRequest.loading,
    editorError: getRequest.error || updateRequest.error || createRequest.error,
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
