import React, { Fragment } from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';

const nameList = ['apple', 'peer', 'banana', 'lemon'];
const Example = props => {
  const [price, setPrice] = useState(0);
  const [name, setName] = useState('apple');

  function getProductName() {
    console.log('getProductName触发');
    return name;
  }
  // 只对name响应
  useEffect(() => {
    console.log('name effect 触发');
    getProductName();
  }, [name]);

  // 只对price响应
  useEffect(() => {
    console.log('price effect 触发');
  }, [price]);

  return (
    <Fragment>
      <p>{name}</p>
      <p>{price}</p>
      <p>{getProductName()}</p>
      <button onClick={() => setPrice(price + 1)}>价钱+1</button>
      <button
        onClick={() =>
          setName(nameList[(Math.random() * nameList.length) << 0])
        }
      >
        修改名字
      </button>
    </Fragment>
  );
};

export default Example;
