/**
 * 基于这两个库的改造，配置参数完全一致，调整了自动捕获错误的逻辑，具备以下功能：
 * 1. 请求错误自动弹出通知；
 * 2. 有自定onError时可屏蔽通知
 *    - 返回ture：屏蔽后续错误，无错误通知
 *    - 返回false：抛出原有错误，有错误通知
 *    - throw Error：抛出原有错误，错误通知显示新的错误
 * 
 * https://github.com/umijs/umi-request
 * https://github.com/alibaba/hooks
 */
import {
    extend,
    Context,
    RequestOptionsInit,
    OnionMiddleware,
    RequestOptionsWithoutResponse,
    RequestMethod,
    RequestOptionsWithResponse,
    RequestResponse,
    RequestInterceptor,
    ResponseInterceptor,
} from 'umi-request';
// @ts-ignore
import { ApplyPluginsType, history, plugin } from 'umi';
import { message, notification } from 'antd';
import useUmiRequest, { UseRequestProvider } from '@ahooksjs/use-request';
import {
    BaseOptions,
    BasePaginatedOptions,
    BaseResult,
    CombineService,
    LoadMoreFormatReturn,
    LoadMoreOptions,
    LoadMoreOptionsWithFormat,
    LoadMoreParams,
    LoadMoreResult,
    OptionsWithFormat,
    PaginatedFormatReturn,
    PaginatedOptionsWithFormat,
    PaginatedParams,
    PaginatedResult,
} from '@ahooksjs/use-request/lib/types';

type ResultWithData<T = any> = { data?: T;[key: string]: any };

/** 
 * 数据请求hook 
 * 
 * @param {string|object|function} service 请求数据的服务
 *  - string 作为url发http请求
 *  - object 作为`umi-request`参数
 *  - function 调用该function
 * 
 * @param options 透传给ahooksjs/use-request 的useRequest参数
*/

interface IUseRequestMethod {
    <
        R = any,
        P extends any[] = any,
        U = any,
        UU extends U = any
        >(
        service: CombineService<R, P>,
        options: OptionsWithFormat<R, P, U, UU>,
    ): BaseResult<U, P>;

    <R extends ResultWithData = any, P extends any[] = any>(
        service: CombineService<R, P>,
        options?: BaseOptions<R['data'], P>,
    ): BaseResult<R['data'], P>;

    <R extends LoadMoreFormatReturn = any, RR = any>(
        service: CombineService<RR, LoadMoreParams<R>>,
        options: LoadMoreOptionsWithFormat<R, RR>,
    ): LoadMoreResult<R>;

    <
        R extends ResultWithData<LoadMoreFormatReturn | any> = any,
        RR extends R = any
        >(
        service: CombineService<R, LoadMoreParams<R['data']>>,
        options: LoadMoreOptions<RR['data']>,
    ): LoadMoreResult<R['data']>;

    <R = any, Item = any, U extends Item = any>(
        service: CombineService<R, PaginatedParams>,
        options: PaginatedOptionsWithFormat<R, Item, U>,
    ): PaginatedResult<Item>;

    <Item = any, U extends Item = any>(
        service: CombineService<
            ResultWithData<PaginatedFormatReturn<Item>>,
            PaginatedParams
        >,
        options: BasePaginatedOptions<U>,
    ): PaginatedResult<Item>;
}

const getUseRequestMethod = () => {
    const requestInstance = (service: any, options: any = {}) => {

        const { onError: userErrorHandle, ...restOpt } = options;

        const ret = useUmiRequest(service, {
      /*FRS*/ formatResult: res => res?.data /*FRE*/,

            //如果 service 是 string 、 object 、 (...args)=> string|object
            //会自动调用requestMethod
            requestMethod: (requestOptions: any) => {
                if (typeof requestOptions === 'string') {
                    return request(requestOptions);
                }
                if (typeof requestOptions === 'object') {
                    const { url, ...rest } = requestOptions;

                    return request(url, rest);
                }
                throw new Error('options参数错误');
            },
            onError: (error: IRequestError, p) => {
                //1:返回ture：屏蔽错误，无错误通知
                //2:返回false：抛出错误，有错误通知
                //3:throw Error：抛出原有错误，显示新的错误通知
                if (userErrorHandle) {
                    try {
                        // 用户onError返回true表示已处理错误，不再显示错误通知。
                        if (userErrorHandle(error, p))
                            return;
                    } catch (newErr) {
                        showError(newErr);
                        return;
                    }
                }
                showError(error);
            },

            ...restOpt,
        });

        //请求出错使用初始数据
        if (ret.error)
            ret.data = options.initialData;
        return ret;
    }

    // 请求语法糖： reguest.get request.post ……
    const requestMethod = (method: string, service: any, options: any = {}) => {
        if (typeof service === "string")
            return requestInstance({ url: service, method }, options);

        if (typeof service === 'object') {
            return requestInstance({ ...service, method }, options);
        }
        throw new Error(`只有string、object两种类型的service支持${method}方法。`);
    };

    requestInstance.get = (service: any, options: any = {}) =>
        requestMethod("GET", service, options)

    requestInstance.post = (service: any, options: any = {}) =>
        requestMethod("POST", service, options)

    requestInstance.delete = (service: any, options: any = {}) =>
        requestMethod("DELETE", service, options)

    requestInstance.put = (service: any, options: any = {}) =>
        requestMethod("PUT", service, options)

    requestInstance.patch = (service: any, options: any = {}) =>
        requestMethod("PATCH", service, options)

    requestInstance.head = (service: any, options: any = {}) =>
        requestMethod("HEAD", service, options)

    requestInstance.options = (service: any, options: any = {}) =>
        requestMethod("OPTIONS", service, options)

    requestInstance.rpc = (service: any, options: any = {}) =>
        requestMethod("RPC", service, options)
    return requestInstance;
}

function showError(error: IRequestError) {
    console.log("内部异常处理", error.message);

    // runtime 配置可能应为依赖顺序的问题在模块初始化的时候无法获取，所以需要封装一层在异步调用后初始化相关方法
    // 当用户的 app.ts 中依赖了该文件的情况下就该模块的初始化时间就会被提前，无法获取到运行时配置
    const requestConfig: RequestConfig = plugin.applyPlugins({
        key: 'request',
        type: ApplyPluginsType.modify,
        initialValue: {},
    });
    const errorAdaptor =
        requestConfig.errorConfig?.adaptor || (resData => resData);

    let errorInfo: IErrorInfo | undefined;
    if (error.name === 'ResponseError' && error.data && error.request) {
        const ctx: Context = {
            req: error.request,
            res: error.response,
        };
        errorInfo = errorAdaptor(error.data, ctx);
        error.message = errorInfo?.errorMessage || error.message;
        error.data = error.data;
        error.info = errorInfo;
    }
    errorInfo = error.info;

    if (errorInfo) {
        const errorMessage = errorInfo?.errorMessage;
        const errorCode = errorInfo?.errorCode;
        const errorPage = requestConfig.errorConfig?.errorPage || DEFAULT_ERROR_PAGE;
        // const errorPage = DEFAULT_ERROR_PAGE;

        switch (errorInfo?.showType) {
            case ErrorShowType.SILENT:
                // do nothing
                break;
            case ErrorShowType.WARN_MESSAGE:
                message.warn(errorMessage);
                break;
            case ErrorShowType.ERROR_MESSAGE:
                message.error(errorMessage);
                break;
            case ErrorShowType.NOTIFICATION:
                notification.open({
                    message: errorMessage,
                });
                break;
            case ErrorShowType.REDIRECT:
                // @ts-ignore
                history.push({
                    pathname: errorPage,
                    query: { errorCode, errorMessage },
                });
                // redirect to error page
                break;
            default:
                message.error(errorMessage);
                break;
        }
    } else {
        message.error(error.message || 'Request error, please retry.');
    }
}

export interface RequestConfig extends RequestOptionsInit {
    errorConfig?: {
        errorPage?: string;
        adaptor?: (resData: any, ctx: Context) => IErrorInfo;
    };
    middlewares?: OnionMiddleware[];
    requestInterceptors?: RequestInterceptor[];
    responseInterceptors?: ResponseInterceptor[];
}

export enum ErrorShowType {
    SILENT = 0,
    WARN_MESSAGE = 1,
    ERROR_MESSAGE = 2,
    NOTIFICATION = 4,
    REDIRECT = 9,
}

interface IErrorInfo {
    success: boolean;
    data?: any;
    errorCode?: string;
    errorMessage?: string;
    showType?: ErrorShowType;
    traceId?: string;
    host?: string;
    [key: string]: any;
}

interface IRequestError extends Error {
    data?: any;
    info?: IErrorInfo;
    request?: Context['req'];
    response?: Context['res'];
}

const DEFAULT_ERROR_PAGE = '/exception';

let requestMethodInstance: RequestMethod;
const getRequestMethod = () => {
    if (requestMethodInstance) {
        // request method 已经示例化
        return requestMethodInstance;
    }

    // runtime 配置可能应为依赖顺序的问题在模块初始化的时候无法获取，所以需要封装一层在异步调用后初始化相关方法
    // 当用户的 app.ts 中依赖了该文件的情况下就该模块的初始化时间就会被提前，无法获取到运行时配置
    const requestConfig: RequestConfig = plugin.applyPlugins({
        key: 'request',
        type: ApplyPluginsType.modify,
        initialValue: {},
    });

    const errorAdaptor =
        requestConfig.errorConfig?.adaptor || (resData => resData);

    requestMethodInstance = extend(requestConfig);

    // 中间件统一错误处理
    // 后端返回格式 { success: boolean, data: any }
    // 按照项目具体情况修改该部分逻辑
    requestMethodInstance.use(async (ctx, next) => {
        await next();
        const { req, res } = ctx;
        // @ts-ignore
        if (req.options?.skipErrorHandler) {
            return;
        }
        const { options } = req;
        const { getResponse } = options;
        const resData = getResponse ? res.data : res;
        const errorInfo = errorAdaptor(resData, ctx);
        if (errorInfo.success === false) {
            // 抛出错误到 errorHandler 中处理
            const error: IRequestError = new Error(errorInfo.errorMessage);
            error.name = 'BizError';
            error.data = resData;
            error.info = errorInfo;
            throw error;
        }
    });

    // Add user custom middlewares
    const customMiddlewares = requestConfig.middlewares || [];
    customMiddlewares.forEach(mw => {
        requestMethodInstance.use(mw);
    });

    // Add user custom interceptors
    const requestInterceptors = requestConfig.requestInterceptors || [];
    const responseInterceptors = requestConfig.responseInterceptors || [];
    requestInterceptors.map(ri => {
        requestMethodInstance.interceptors.request.use(ri);
    });
    responseInterceptors.map(ri => {
        requestMethodInstance.interceptors.response.use(ri);
    });

    return requestMethodInstance;
};

interface RequestMethodInUmi<R = false> {
    <T = any>(
        url: string,
        options: RequestOptionsWithResponse & { skipErrorHandler?: boolean },
    ): Promise<RequestResponse<T>>;
    <T = any>(
        url: string,
        options: RequestOptionsWithoutResponse & { skipErrorHandler?: boolean },
    ): Promise<T>;
    <T = any>(
        url: string,
        options?: RequestOptionsInit & { skipErrorHandler?: boolean },
    ): R extends true ? Promise<RequestResponse<T>> : Promise<T>;
}
const request: RequestMethodInUmi = (url: any, options: any) => {
    return getRequestMethod()(url, options);
};
const useRequest = getUseRequestMethod();

export { request, useRequest, UseRequestProvider };
