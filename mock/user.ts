import { Response } from 'umi'
import delay from 'delay'

export default {
    "/users": async (req:Request,res:Response)=>{
        await delay(3000);
        res.status(404).end('{name:"admin"}')
    },
}