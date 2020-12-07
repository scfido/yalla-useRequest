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
import { showError, IRequestError } from './models/appModel';

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
export interface IUseRequestMethod {
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

const setUrlArgs = (service: any, args: any = {}) => {
    // 参数中有url就直接使用
    if (args.url)
        return args.url;

    // 将url中的":name" 替换成 args[name]的值
    let { url }: { url: string } = service;
    return url.replace(/:(\w+)/, (_, sub) => args[sub]);
}

const useRequest = function (service: any, options: any = {}) {
    //  强制转换为object类型参数
    let objService: any;
    if (typeof service === 'string') {
        objService = { url: service };
    }

    if (typeof service === 'object') {
        objService = service;
    }

    const serviceFn = (args: any) => {
        objService.url = setUrlArgs(objService, args);
        return { ...objService, ...args };
    }

    // 默认为手动请求，因为大部分情况都是手动。
    if (options.manual === undefined)
        options.manual = true;

    const { onError: userErrorHandle, ...restOpt } = options;

    const ret = useUmiRequest(serviceFn, {
        //   /*FRS*/ formatResult: res => res?.data /*FRE*/,

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
                    console.log(newErr);
                    return;
                }
            }
            console.log(error);
        },
        ...restOpt,
    });

    return ret;
} as IUseRequestMethod

export interface RequestConfig extends RequestOptionsInit {
    errorConfig?: {
        errorPage?: string;
        adaptor?: (resData: any, ctx: Context) => IRequestError;
    };
    middlewares?: OnionMiddleware[];
    requestInterceptors?: RequestInterceptor[];
    responseInterceptors?: ResponseInterceptor[];
}


const DEFAULT_ERROR_PAGE = '/exception';

let requestInstance: RequestMethod;
const getRequest = (): RequestMethod => {
    if (requestInstance) {
        // request method 已经示例化
        return requestInstance;
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

    requestInstance = extend({
        errorHandler: (error) => {
            //业务错误直接显示
            switch (error.name) {
                case "BizError":
                    showError(error);
                    break;

                case "ResponseError":
                    if (error.data && error.request) {
                        const ctx: Context = {
                            req: error.request,
                            res: error.response,
                        };
                        const newError = errorAdaptor(error.data, ctx);
                        showError(newError);
                    }
                    break;

                default:
                    showError(error);
            }
        },
        ...requestConfig
    });

    // 中间件统一错误处理
    // 后端返回格式 { success: boolean, data: any }
    // 按照项目具体情况修改该部分逻辑
    requestInstance.use(async (ctx, next) => {
        await next();
        const { req, res } = ctx;
        const { options } = req;
        const { getResponse } = options;
        const resData = getResponse ? res.data : res;
        const error = errorAdaptor(resData, ctx);
        if (error) {
            // 抛出错误到 errorHandler 中处理
            error.name = "BizError";
            // throw error;
        }
    });

    // Add user custom middlewares
    const customMiddlewares = requestConfig.middlewares || [];
    customMiddlewares.forEach(mw => {
        requestInstance.use(mw);
    });

    requestInstance.interceptors.request.use(
        (url, options) => {
            console.log(url);
            return { url, options };
        },
        { global: true }
    );

    requestInstance.interceptors.response.use(
        (response, options) => {
            console.log(response.url);
            return response;
        },
        { global: true }
    );

    // Add user custom interceptors
    const requestInterceptors = requestConfig.requestInterceptors || [];
    const responseInterceptors = requestConfig.responseInterceptors || [];
    requestInterceptors.map(ri => {
        requestInstance.interceptors.request.use(ri);
    });
    responseInterceptors.map(ri => {
        requestInstance.interceptors.response.use(ri);
    });

    return requestInstance;
};

const request = getRequest()

export { request, useRequest, UseRequestProvider };
