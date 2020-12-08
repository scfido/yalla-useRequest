import { Response } from 'umi';
import delay from 'delay';

export default {
  '/api/users': async (req: Request, res: Response) => {
    await delay(3000);
    res
      .status(400)
      .json([
        {
          id: '1',
          firstName: 'John',
          lastName: 'Brown',
          age: 32,
          address: 'New York No. 1 Lake Park',
          tags: ['nice', 'developer'],
        },
        {
          id: '2',
          firstName: 'Jim',
          lastName: 'Green',
          age: 42,
          address: 'London No. 1 Lake Park',
          tags: ['loser'],
        },
        {
          id: '3',
          firstName: 'Joe',
          lastName: 'Black',
          age: 32,
          address: 'Sidney No. 1 Lake Park',
          tags: ['cool', 'teacher'],
        },
      ])
      .end();
  },
  'DELETE /api/users/:id': async (req: Request, res: Response) => {
    await delay(1000);
    res.setHeader("_AbpErrorFormat", "true");
    res.status(404).json({
      error: {
        code: "APP:001",
        message: "服务端错误"
      }
    });
  },
  '/api/error': async (req: Request, res: Response) => {
    await delay(3000);
    res.status(404).end();
  },
};
