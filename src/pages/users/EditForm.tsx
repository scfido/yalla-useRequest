import React, { useEffect, useReducer } from 'react';
import { Modal, Form, Input, Button, Alert, Spin } from 'antd';
import { useModel, history } from 'umi';
import { IUser } from '@/models/userModel';
import { useParams } from 'react-router-dom'
import { models } from '@/.umi/plugin-model/Provider';
import user from 'mock/user';

const layout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 16 },
};
const messageLayout = {
  wrapperCol: { span: 24 },
};

enum EditTypes {
  create = "create",
  edit = "edit"
}

interface IUrlParams {
  editType: EditTypes,
  id: string,
}

export default () => {
  const { fetch, create, update, remove, error, loading, saving } = useModel(
    'userModel',
    ({
      editorLoading,
      editorSaving,
      editorError,
      fetch,
      create,
      update,
      remove,
    }) => ({
      loading: editorLoading,
      saving: editorSaving,
      error: editorError,
      fetch,
      create,
      update,
      remove,
    }),
  );

  const { editType, id }: IUrlParams = useParams();
  useEffect(() => {
    if (id?.length > 0) {
      fetch(id)
        .then((user: IUser) => form.setFieldsValue(user))
    }
  }, [id])

  const [form] = Form.useForm<IUser>();

  const handleCancel = () => {
    form.resetFields();
    history.replace("/users")
  };

  const handleFinish = (data: IUser) => {
    const isUpdate = editType === EditTypes.edit;
    if (isUpdate)
      update(id, data)
        .then(() => {
          form.resetFields();
          history.replace("/users")
        });
    else
      create(data)
        .then(() => {
          form.resetFields();
          history.replace("/users")
        });
  };

  return (
    <Modal
      title={editType == EditTypes.edit ? "编辑用户" : "创建用户"}
      visible={editType === EditTypes.create || editType === EditTypes.edit}
      onOk={() => form.submit()}
      onCancel={handleCancel}
      okText="保存"
      cancelText="取消"
      okButtonProps={{
        disabled: loading && error !== undefined,
        loading: saving,
      }}
    >
      <Spin spinning={loading} >
        <Form {...layout} form={form} name="users" onFinish={handleFinish}>
          {error && <Form.Item {...messageLayout}>
            <Alert type="error" message={`请求错误，参考：${error?.message}`}></Alert>
          </Form.Item>}
          <Form.Item name="firstName" label="姓" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="lastName" label="名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};
