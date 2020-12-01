import { request, useRequest } from '@/myRequest';

export interface IUserModel {
    data: string;
    error?: Error;
    loading: boolean;
}

export default (): IUserModel => {
    // const { data, error, loading }  = useRequest("/users");
    const { data, error, loading } = useRequest("/users",
        {
            initialData: { name: "init" },
            onError: (e: Error) => {
                console.log("外部onError: ", e.message);
                throw new Error("新错误")
                return true;
            }
        });

    return {
        data,
        error,
        loading
    }
}