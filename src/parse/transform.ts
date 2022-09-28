import _ from 'lodash';
import { safeEval, isEvaluable, isLiteralType, extractLiteralType, isAtomicType, transformCode } from '../utils/index';

export function transformType(itemType: any) {
  if (typeof itemType === 'string') {
    if(isLiteralType(itemType)) return extractLiteralType(itemType)
    if(isAtomicType(itemType)) return itemType
    itemType = {
      name: itemType,

    }
  }
  const {
    name,
    value,
    required,
    type,
    raw,
    params,
    returns,
  } = itemType;
  const result: any = {
    type: name,
  };
  if (required) {
    result.isRequired = required;
  }
  switch (name) {
    case 'number':
    case 'string':
    case 'bool':
    case 'any':
    case 'symbol':
    case 'object':
    case 'null':
    case 'array':
    case 'element':
    case 'node':
    case 'void':
      break;
    case 'func':
      if (params) {
        result.params = params.map((x: any) => {
          const res: any = {
            name: x.name,
            propType: transformType(x.type || x.propType),
          };
          if (x.description) {
            res.description = x.description;
          }
          return res;
        });
      }
      if (returns) {
        result.returns = {
          propType: transformType(returns.type || returns.propType),
        };
      }
      if (raw) {
        result.raw = raw;
      }
      break;
    case 'literal': {
      result.type = 'oneOf';
      try {
        const literalValue = safeEval(value);
        result.value = [literalValue];
      } catch (e) {
        result.value = [raw];
      }
      break;
    }
    case 'enum':
    case 'oneOf':
      result.type = 'oneOf';
      result.value = value.map(transformType);
      break;
    case 'tuple':
      result.type = 'tuple';
      result.value = value.map(transformType);
      break;
    case 'union': {
      if (itemType.raw) {
        if (itemType.raw.match(/ReactNode$/)) {
          result.type = 'node';
          break;
        } else if (itemType.raw.match(/Element$/)) {
          result.type = 'element';
          break;
        }
      }
    }
    // eslint-disable-next-line no-fallthrough
    case 'oneOfType':
      result.type = 'oneOfType';
      result.value = value.map(transformType);
      break;
    case 'boolean':
      result.type = 'bool';
      break;
    case 'Function':
      result.type = 'func';
      break;
    case 'unknown':
      result.type = 'any';
      break;
    case 'Array':
    case 'arrayOf': {
      result.type = 'arrayOf';
      let _itemType = transformType(value[0]);
      if (typeof _itemType === 'object') {
        _itemType = _.omit(_itemType, ['isRequired']);
      }

      result.value = _itemType;
      break;
    }
    case 'signature': {
      if (typeof type === 'string') {
        result.type = type;
        break;
      }
      result.type = 'shape';
      const properties = type?.signature?.properties || itemType?.signature?.properties || [];
      if (properties.length === 0) {
        if (raw?.includes('=>')) {
          result.type = 'func';
          result.raw = raw;
        } else {
          result.type = 'object';
        }
      } else if (properties.length === 1 && typeof properties[0].key === 'object') {
        const v = transformType(properties[0].value);
        if (v === 'any') {
          result.type = 'object';
        } else if (typeof v === 'string') {
          result.value = v;
          result.type = 'objectOf';
        } else if (typeof v?.type === 'string') {
          result.value = v.type;
          result.type = 'objectOf';
        } else {
          result.type = 'object';
        }
      } else if (properties.length === 1 && properties[0].key === '__call') {
        result.type = 'func';
      } else {
        result.value = properties
          .filter((item: any) => typeof item.key !== 'object')
          .map((prop: any) => {
            const { key } = prop;
            const typeItem = {
              ..._.omit(prop.value, 'name'),
              type: prop.value.type || {},
            };
            typeItem.type = {
              ...typeItem.type,
              ..._.pick(prop.value, ['name', 'value']),
            };
            return transformProp(key, typeItem);
          });
      }
      break;
    }
    case 'objectOf':
    case 'instanceOf':
      result.value = transformType(value);
      break;
    case 'exact':
    case 'shape':
      result.value = Object.keys(value).map((n) => {
        const { name: _name, ...others } = value[n];
        return transformProp(n, {
          ...others,
          type: {
            name: _name,
          },
        });
      });
      break;
    case (name.match(/ReactNode$/) || {}).input:
    case (name.match(/^ElementType/) || {}).input:
    case (name.match(/^ReactInstance/) || {}).input:
      result.type = 'node';
      break;
    case (name.match(/JSX\.Element$/) || {}).input:
    case (name.match(/^ReactElement/) || {}).input:
      result.type = 'element';
      break;
    case (name.match(/\|/) || {}).input:
      if (name.split('|').every(isLiteralType)) {
        result.type = 'oneOf'
        result.value = name.split('|').map(extractLiteralType)
      } else {
        result.type = 'oneOfType';
        result.value  = name.split('|').map((i: string) => transformType(i.trim()))
      }
      break;
    case (name.match(/\[\]/) || {}).input:
      result.type = 'array'
      const match = /([\w]*)?\[\]/.exec(name)
      if (match && match[1])  {
        result.type = 'arrayOf'
        result.value = transformType(match[1])
      }
      break;
    default:
      result.type = 'object';
      break;
  }

  if (Object.keys(result).length === 1) {
    return result.type;
  }
 
  return result;
}

function transformDefaultValue(defaultValue: any) {
  if (!_.isNil(defaultValue) && typeof defaultValue === 'object' && isEvaluable(defaultValue)) {
    return transformCode(defaultValue.value);
  }

  return undefined
}

export function transformProp(name: string, item: any) {
  const {
    description,
    type,
    required,
    defaultValue,
    ...others
  } = item;
  const result: any = {
    name,
  };

  if (type) {
    result.propType = transformType({
      ...type,
      ..._.omit(others, ['name']),
      required: !!required,
    });
  }
  if (description) {
    if (description.includes('\n')) {
      result.description = description.split('\n')[0];
    } else {
      result.description = description;
    }
  }
  if (!_.isNil(defaultValue)) {
    result.defaultValue = transformDefaultValue(defaultValue)
  }
  
  if (result.propType === undefined) {
    delete result.propType;
  }

  return result;
}
