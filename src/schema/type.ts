export type PropType = BasicType | RequiredType | ComplexType;
export type BasicType = 'array' | 'bool' | 'func' | 'number' | 'object' | 'string' | 'node' | 'element' | 'any';
export type ComplexType = OneOf | OneOfType | ArrayOf | ObjectOf | Shape | Exact;
export interface RequiredType {
    type: BasicType;
    isRequired?: boolean;
}
export interface OneOf {
    type: 'oneOf';
    value: Array<string | number | boolean>;
    isRequired?: boolean;
    [k: string]: any;
}
export interface OneOfType {
    type: 'oneOfType';
    value: PropType[];
    isRequired?: boolean;
    [k: string]: any;
}
export interface ArrayOf {
    type: 'arrayOf';
    value: PropType;
    isRequired?: boolean;
    [k: string]: any;
}
export interface ObjectOf {
    type: 'objectOf';
    value: PropType;
    isRequired?: boolean;
    [k: string]: any;
}
export interface Shape {
    type: 'shape';
    value: Array<{
      name?: string;
      propType?: PropType;
    }>;
    isRequired?: boolean;
    [k: string]: any;
}
export interface Exact {
    type: 'exact';
    value: Array<{
        name?: string;
        propType?: PropType;
    }>;
    isRequired?: boolean;
    [k: string]: any;
}

export interface Prop {
    name: string;
    propType: PropType;
    description?: string;
    defaultValue?: any;
    [k: string]: any;
}