declare type JSONType = Record<string, JSONValue>
declare type JSONValue = null | string | boolean | number | JSONValue[] | { [props: string]:  JSONValue}
