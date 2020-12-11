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

enum Actions {
  create = "create",
  edit = "edit"
}

interface IUrlParams {
  action: Actions,
  id: string,
}

export default () => {
  const model = useModel('userModel',
    //明确要使用model的值可以优化性能
    m => ({
      loading: m.editorLoading,
      saving: m.editorSaving,
      error: m.editorError,
      fetch: m.fetch,
      create: m.create,
      update: m.update,
      remove: m.remove,
      goHome: m.goHome,
    }),
  );

  const [form] = Form.useForm<IUser>();
  const { action: action, id }: IUrlParams = useParams();

  useEffect(() => {
    if (id?.length > 0) {
      model.fetch(id)
        .then((user: IUser) => form.setFieldsValue(user))
    }
  }, [id])


  const handleCancel = () => {
    form.resetFields();
    model.goHome()
  };

  const handleFinish = (data: IUser) => {
    const isUpdate = action === Actions.edit;
    if (isUpdate)
      model.update(id, data)
        .then(() => {
          form.resetFields();
          model.goHome()
        });
    else
      model.create(data)
        .then(() => {
          form.resetFields();
          model.goHome();
        });
  };

  return (
    <Modal
      title={action == Actions.edit ? "编辑用户" : "创建用户"}
      visible={action === Actions.create || action === Actions.edit}
      onOk={() => form.submit()}
      onCancel={handleCancel}
      okText="保存"
      cancelText="取消"
      okButtonProps={{
        disabled: model.loading || model.error != undefined,
        loading: model.saving,
      }}
    >
      <Spin spinning={model.loading} >
        <Form {...layout} form={form} name="users" onFinish={handleFinish}>
          {model.error && <Form.Item {...messageLayout}>
            <Alert type="error" message={`请求错误，参考：${model.error?.message}`}></Alert>
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
