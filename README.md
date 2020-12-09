# 简介

本项目是基于[umi-request](https://github.com/umijs/umi-request)和alibaba的[hooks](https://github.com/alibaba/hooks)两个库的封装，使用ABP作为服务端时的应用案例。

使用本项目必须要先了解上述两个库的用途和区别。

## Getting Started

Install dependencies,

```bash
$ yarn
```

Start the dev server,

```bash
$ yarn start
```

## 页面加载时就自动获取数据

请求出错自动弹出错误通知
```ts
const { data: users, error, loading } = useRequest<IUser[]>('/api/users',
    {
      manual:false,
      initialData: [],  //初始数据
    },
  );
```

自行处理错误信息，并控制是否弹出错误通知
```ts
const { data: users, error, loading } = useRequest<IUser[]>('/api/users',
    {
      manual:false,
      initialData: [],  //初始数据
      onError: (e: Error) => {
        console.log("外部捕获错误onError: ", e.message);
        return true;    //返回ture表示已处理，不在显示通知。
      },
    },
  );
```
## 手动获取数据

`manual`选项被设置为默认为`true`手动获取数据，在调用`run`函数时传入的参数可以自动替换url`:id`变量。
```ts
const getRequest = useRequest<IUser>('/api/users/:id');
const { data, error, loading } = getRequest;
getRequest.run({id:100})   //用于替换url的参数
```
## 直接请求数据

不用useRequet的情况，例如删除数据操作就适合直接调用。请求错误会自动显示错误通知。
```ts
request.delete(`/api/users/${id}`);
```

自行处理错误，不显示错误通知的情况。
```ts
request.delete({url:`/api/users/${id}`, errorHandler:(error)=>{});

```

