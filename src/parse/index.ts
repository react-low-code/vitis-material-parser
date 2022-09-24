import findConfig from 'find-config'
import ts from 'typescript'
import { Parser } from 'react-docgen-typescript';
import _ from 'lodash';
import fs from 'fs-extra'
import { transformProp } from './transform'
import { Prop } from '../schema/type'

function createProgram(filePath: string, args: {workDir: string; tsconfigFileName?: string }) {
  const tsconfigFileName = args.tsconfigFileName || 'tsconfig.json'
  const tsConfigPath = findConfig(tsconfigFileName, { cwd: args.workDir })

  if (!tsConfigPath) {
      throw new Error(`在 ${args.workDir} 没有找的 tsconfig.json`);
  }

  const { config, error } = ts.readConfigFile(tsConfigPath, (filename) => {
      return fs.readFileSync(filename, 'utf8')
  });

  if (error !== undefined) {
      throw new Error(`在 ${args.workDir} 不能加载 tsconfig.json，错误码 ${error.code}, 错误信息 ${error.messageText}`);
  }

  const { options, errors } = ts.parseJsonConfigFileContent(config, ts.sys, args.workDir, {}, tsConfigPath)

  if (errors.length) {
      throw errors[0];
  }
  return ts.createProgram([filePath], options);
}

function getExportDefaultSymbol(checker: ts.TypeChecker, node: ts.Node) {
  const symbol = checker.getSymbolAtLocation(node);

    if (!symbol) {
        return undefined
    }
    const exportSymbols = checker.getExportsOfModule(symbol);
    let exportDefaultSymbol:ts.Symbol | undefined = undefined

    for (let index = 0; index < exportSymbols.length; index++) {
        const sym: ts.Symbol = exportSymbols[index];

        // 排除命名导出
        if (sym.getName() !== "default") {
          continue;
        }

        sym.valueDeclaration =
          sym.valueDeclaration || (Array.isArray(sym.declarations) ? sym.declarations[0] : undefined);

        if (!sym.valueDeclaration) {
          continue;
        }
        exportDefaultSymbol = sym
        break;
    }

    return exportDefaultSymbol
}

function getComponentInfo(filePath: string, args: {workDir: string; tsconfigFileName?: string }) {
  const program = createProgram(filePath, args)
    
  const sourceFile = program.getSourceFile(filePath);

  if (!sourceFile) {
      return null
  }
  const checker = program.getTypeChecker();
  let exportDefaultSymbol = getExportDefaultSymbol(checker, sourceFile)

  if (!exportDefaultSymbol) {
    return null
  }
  const parser = new Parser(program, {})

  return parser.getComponentInfo(exportDefaultSymbol, sourceFile);
}

export default function(filePath: string, args: {workDir: string; tsconfigFileName?: string }): { props: Prop[] }[] {
    if (!filePath) {
        return []
    }

    const componentInfo = getComponentInfo(filePath, args);
    if (!componentInfo || !componentInfo.props || _.isEmpty(componentInfo.props)) {
      return []
    }

    const propsName = Object.keys(componentInfo.props);
    const props: Prop[] = []

    propsName.forEach(name => {
      if (!name.startsWith('aria-')) {
        try {
          const item: Prop = transformProp(name, componentInfo.props[name]);
          props.push(item);
        } catch (e) {
          console.log(e)
        }
      }
    })

    return [{props}]
}