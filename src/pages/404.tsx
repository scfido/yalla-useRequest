import React from 'react';
import {Link, history}from "umi";

export default () => {
    return (
        <div>
            <h1>页面没有找到</h1>
            <Link to="/" >首页</Link> | 
            <a onClick={()=>history.goBack() } >后退</a>
        </div>
    );
};
