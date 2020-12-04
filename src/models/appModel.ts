import { request } from '@/abpRequest';
import { useEffect, useState } from 'react';
import { List } from 'immutable';
import queryString from 'query-string';
import { Context, } from 'umi-request';

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

export interface IAppModel {
    remove(id: number): void;
    setError(error: Error): void;
    error?: IRequestError;
    loading: boolean;
    loadingUrls: string[];
}

const name = Math.random() * 10000;

let errorSubscriber: ((error: IRequestError) => void) | undefined;
let loadingSubscriber: ((url: string, loading: boolean) => void) | undefined;

export const showError = (error: IRequestError) => {
    if (errorSubscriber)
        errorSubscriber(error);

    console.log("notification: " + name)
}

export const setLoading = (url: string, loading: boolean) => {
    if (loadingSubscriber)
        loadingSubscriber(url, loading);

    console.log("loading: " + url + loading)
}

const appMode = (): IAppModel => {
    const [error, setError] = useState<IRequestError>();
    const [loadingUrls, setLoadingUrls] = useState<string[]>([]);

    const subscribeError = (error?: IRequestError) => {
        setError(error);
    }

    const subscribeLoading = (url: string, loading: boolean) => {
        const normalizeUrl = queryString.parseUrl(url).url;
        const urls = List(loadingUrls);

        if (loading) {
            if (loadingUrls.indexOf(normalizeUrl) === -1) {
                setLoadingUrls(urls.insert(0, normalizeUrl).toArray())
            }
        }
        else {
            const index = loadingUrls.indexOf(normalizeUrl);
            if (index >= 0)
                setLoadingUrls(urls.remove(index).toArray())
        }
    }

    let loading = loadingUrls.length > 0;

    useEffect(() => {
        //订阅通知
        errorSubscriber = subscribeError;
        loadingSubscriber = subscribeLoading;
        return () => {
            // 退订
            errorSubscriber = undefined;
            loadingSubscriber = undefined;
        }
    }, [])


    const remove = (id: number) => {
        request.delete(`/users/${id}`)
    }

    return {
        setError: subscribeError,
        remove,
        error,
        loading,
        loadingUrls,
    }
}

export default appMode