export type PropType = BasicType | ComplexType;
export type ComplexType = OneOf | OneOfType | ArrayOf | ObjectOf | Shape | Exact;
export interface BasicType {
    type: 'array' | 'bool' | 'func' | 'number' | 'object' | 'string' | 'node' | 'element' | 'any';
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

export interface SetterConfig {
    /**设置器的名称 */
    setterName: string;
    /**是否使用组件包自带的设置器 */
    isUseSelf?: boolean;
    /**传递给设置器的属性 */
    props?: object;
}

export interface Prop {
    name: string;
    propType: PropType;
    description?: string;
    defaultValue?: any;
    setter: SetterConfig | SetterConfig[]
    isShow?: boolean;
    [k: string]: any;
}