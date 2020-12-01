# umi project

基于这两个库的改造，配置参数完全一致，调整了自动捕获错误的逻辑，具备以下功能：
1. 请求错误自动弹出通知；
2. 有自定onError时可屏蔽通知
   - 返回ture：屏蔽后续错误，无错误通知
   - 返回false：抛出原有错误，有错误通知
   - throw Error：抛出原有错误，错误通知显示新的错误

- https://github.com/umijs/umi-request
- https://github.com/alibaba/hooks
 */

## Getting Started

Install dependencies,

```bash
$ yarn
```

Start the dev server,

```bash
$ yarn start
```
