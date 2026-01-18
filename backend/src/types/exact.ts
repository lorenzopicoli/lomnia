export type Exact<T, Shape extends T> = T & Record<Exclude<keyof Shape, keyof T>, never>;
