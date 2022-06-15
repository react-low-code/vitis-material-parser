import findConfig from 'find-config'
import ts from 'typescript'
import { Parser } from 'react-docgen-typescript';
import _ from 'lodash';
import fs from 'fs-extra'
import { transformItem } from './transform'
import { Prop } from '../schema/type'

const blacklistNames = [
    'prototype',
    'getDerivedStateFromProps',
    'propTypes',
    'defaultProps',
    'contextTypes',
    'displayName',
    'contextType',
    'Provider',
    'Consumer',
];

export default function(filePath: string, args: {workDir: string; tsconfigFileName?: string }): { props: Prop[] }[] {
    if (!filePath) {
        return []
    }
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
    const program = ts.createProgram([filePath], options);

    const parser = new Parser(program, {})

    const checker = program.getTypeChecker();
    
    const sourceFile = program.getSourceFile(filePath);

    if (!sourceFile) {
        return []
    }

    const moduleSymbol = checker.getSymbolAtLocation(sourceFile as ts.Node);

    if (!moduleSymbol) {
        return []
    }

    const exportSymbols = checker.getExportsOfModule(moduleSymbol);
    const result: any[] = []

    for (let index = 0; index < exportSymbols.length; index++) {
        const sym: ts.Symbol = exportSymbols[index];

        const name = sym.getName();
        // 排查命名导出
        if (blacklistNames.includes(name) || name !== "default") {
          continue;
        }

        sym.valueDeclaration =
          sym.valueDeclaration || (Array.isArray(sym.declarations) ? sym.declarations[0] : undefined);

        if (!sym.valueDeclaration) {
          continue;
        }

        const componentInfo = parser.getComponentInfo(sym, sourceFile);
       
        if (componentInfo === null) {
          continue;
        }

        result.push(componentInfo)
    }

    const coms = result.reduce((res: any[], info: any) => {
        if (!info || !info.props || _.isEmpty(info.props)) return res;

        const props = Object.keys(info.props).reduce((acc: any[], name) => {
          // 忽略 aria 开头的属性
          if (name.startsWith('aria-')) {
            return acc;
          }
          try {
            const item: any = transformItem(name, info.props[name]);
            acc.push(item);
          } catch (e) {
            console.log(e)
          }
          return acc;
        }, []);

        res.push({
          props
        });
        return res;
      }, []);

      return coms
}