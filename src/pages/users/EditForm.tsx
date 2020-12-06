import React, { useReducer } from 'react';
import { Modal, Form, Input, Button, Alert } from 'antd';
import { useModel } from 'umi';
import { IUser } from '@/models/userModel';
import { models } from '@/.umi/plugin-model/Provider';

const layout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 16 },
};
const messageLayout = {
  wrapperCol: { span: 24 },
};

export default () => {
  const { visible, hide, error, loading, saving } = useModel(
    'userModel',
    ({
      editorVisible,
      hideEditor,
      editorLoading,
      editorSaving,
      editorError,
    }) => ({
      visible: editorVisible,
      hide: hideEditor,
      loading: editorLoading,
      saving: editorSaving,
      error: editorError,
    }),
  );
  console.log('user editor visible: ' + visible);

  const handleOk = () => {
    hide();
  };

  const handleCancel = () => {
    hide();
  };

  const [form] = Form.useForm<IUser>();

  const onFinish = (values: IUser) => {
    console.log(values);
  };

  return (
    <Modal
      title="Basic Modal"
      visible={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="保存"
      cancelText="取消"
      okButtonProps={{
        disabled: loading && error !== undefined,
        loading: saving,
      }}
      confirmLoading={true}
    >
      <Form {...layout} form={form} name="control-hooks" onFinish={onFinish}>
        <Form.Item {...messageLayout}>
          {error && <Alert type="error" message={error?.message}></Alert>}
        </Form.Item>
        <Form.Item name="firstName" label="姓" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="lastName" label="名" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};
