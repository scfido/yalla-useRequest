import { Response } from 'umi'
import delay from 'delay'

export default {
    "/users": async (req: Request, res: Response) => {
        await delay(3000);
        res.json({
            data: {
                name: "admin"
            }
        })
    },
    "DELETE /users/:id":async (req: Request, res: Response) => {
        await delay(1000);
        res.status(500).end()
    },
    "/error": async (req: Request, res: Response) => {
        await delay(3000);
        res.status(404).end()
    },
}