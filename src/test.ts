interface SearchFunc {
    (source: string, subString: string): boolean;
    (source: string, subString: string, startIndex: number): string;
    log(text: string): void;
}

//  let mySearch1: SearchFunc;
let mySearch = function (): SearchFunc {
    const instance  = function (s: string, sub: string)  {
        let result = s.search(sub);
        return result > -1;
    } as SearchFunc;

    instance.log = (text: string) => {
        console.log(text);
    }

    return instance;
}

const my = mySearch();
console.log(my("abc", "b"))


my.log("aaa");