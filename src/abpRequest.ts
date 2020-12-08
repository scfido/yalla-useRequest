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

export enum ErrorShowType {
    SILENT = 0,
    WARN = 1,
    ERROR = 2,
    NOTIFICATION = 4,
    REDIRECT = 9,
}

export interface IRequestError extends Error {
    code?: string;
    message: string;
    details?: string;
    data?: any;
    showType?: ErrorShowType;
    traceId?: string;
    request?: Context['req'];
    response?: Context['res'];
    [key: string]: any;
}

async function showError(error: IRequestError) {
    console.log("内部异常处理", error.message);

    const msg = error.data?.error?.message || error.message;
    const status = error.response?.status;
    switch (status) {
        case 400:
            message.error("请求数据有误，参考：" + msg);
            break;

        case 401:
            message.error("用户需要登录，参考：" + msg);
            break;

        case 403:
            message.error("访问被拒绝，参考：" + msg);
            break;

        case 404:
            message.error("数据没有找到，参考：" + msg);
            break;

        case 500:
            message.error("服务内部错误，参考：" + msg);
            break;

        default:
            message.error(msg || '服务请求错误，请重试。');
    }
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
          /*FRS*/ formatResult: res => res?.data /*FRE*/,
        //会自动调用requestMethod
        requestMethod: (requestOptions: any) => {
            if (typeof requestOptions === 'string') {
                return request(requestOptions);
            }
            if (typeof requestOptions === 'object') {
                const { url, ...rest } = requestOptions;

                // 有用户处理错误的方法，就屏蔽内部handle，不显示request的错误通知
                if (userErrorHandle)
                    rest.errorHandler = undefined;

                return request(url, rest);
            }

            throw new Error('options参数只能是string或object类型');
        },
        onError: (error: IRequestError, p) => {
            //1:返回ture：屏蔽错误，无错误通知
            //2:返回false：抛出错误，有错误通知
            //3:throw Error：抛出原有错误，显示新的错误通知
            if (userErrorHandle) {
                if (userErrorHandle(error, p))
                    return;
            }
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

let requestInstance: RequestMethod<true>;
const getRequest = (): RequestMethod<true> => {
    if (requestInstance) {
        // request method 已经示例化
        return requestInstance;
    }

    requestInstance = extend({
        getResponse: true,
        errorHandler: async (error) => {
            showError(error);
        },
    });

    // 中间件统一错误处理
    // 后端错误在头中添加“_AbpErrorFormat: true”
    // 按照项目具体情况修改该部分逻辑
    requestInstance.use(async (ctx, next) => {
        await next();

        // 处理http status 200的错误信息。抛出到 errorHandler 中处理
        const { res } = ctx;
        if (res.response.headers.get("_AbpErrorFormat") === "true") {
            const error = res.data;
            error.name = "BizError";
            throw error;
        }
    });

    return requestInstance;
};

const request = getRequest()

export { request, useRequest, UseRequestProvider };
