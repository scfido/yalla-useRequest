import { IUser, IUserModel } from '@/models/userModel';
import React, { useReducer } from 'react';
import { Button, Table, Tag, Space } from 'antd';
import { Link, useModel } from 'umi';
import { Spin } from 'antd';

export default () => {
  const model = useModel('userModel');

  const { Column, ColumnGroup } = Table;

  return (
    <Table<IUser> dataSource={model.users} rowKey="id" loading={model.loading}>
      <ColumnGroup title="Name">
        <Column title="First" dataIndex="firstName" key="firstName" />
        <Column title="Last" dataIndex="lastName" key="lastName" />
      </ColumnGroup>
      <Column title="Age" dataIndex="age" key="age" />
      <Column title="Address" dataIndex="address" key="address" />
      <Column
        title="Tags"
        dataIndex="tags"
        key="tags"
        render={(tags: string[]) => (
          <>
            {tags.map(tag => (
              <Tag color="blue" key={tag}>
                {tag}
              </Tag>
            ))}
          </>
        )}
      />
      <Column<IUser>
        title="Action"
        key="action"
        render={(text, user) => (
          <Space size="middle">
            <Link to={`/users/edit/${user.id}`} replace={true}>编辑</Link>
            <a onClick={() => model.remove(user.id)}>删除</a>
          </Space>
        )}
      />
    </Table>
  );
};
