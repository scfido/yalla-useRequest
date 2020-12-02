import { request, useRequest } from '@/abpRequest';

export interface IUserModel {
    data: { name: string };
    error?: Error;
    loading: boolean;
}

export default (): IUserModel => {
    const { data, error, loading } = useRequest("/error", 
        {
            initialData: { name: "init" },
            onError: (e: Error) => {
                //console.log("外部onError: ", e.message);
                //throw new Error("新错误")
                //return true;
            }
        });

    return {
        data,
        error,
        loading
    }
}