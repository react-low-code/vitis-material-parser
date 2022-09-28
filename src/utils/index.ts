import spawn from 'cross-spawn-promise';
import originalSafeEval from 'safe-eval';
import ts from 'typescript'
import * as path from 'path';
import fs from 'fs-extra';
import _ from 'lodash';

export async function isNPMInstalled(args: {workDir: string}) {
  return fs.pathExists(path.join(args.workDir, 'node_modules'));
}

export async function install(args: { workDir: string; npmClient?: string }) {
    if (await isNPMInstalled(args)) return;
    const { workDir, npmClient = 'npm' } = args;
    try {
      await spawn(npmClient, ['i'], { stdio: 'inherit', cwd: workDir } as any);
    } catch (e) {
      // TODO
    }
}

export async function isNPMModuleInstalled(
  args: { workDir: string; npmClient?: string },
  name: string,
) {
  const modulePkgJsonPath = path.resolve(args.workDir, 'node_modules', name, 'package.json');
  return fs.pathExists(modulePkgJsonPath);
}

export async function installModule(
  args: { workDir: string; npmClient?: string },
  name: string,
) {
  if (await isNPMModuleInstalled(args, name)) return;
  const { workDir, npmClient = 'npm' } = args;
  try {
    await spawn(npmClient, ['i', name], { stdio: 'inherit', cwd: workDir } as any);
  } catch (e) {
    // TODO
  }
}

export function safeEval(value: any) {
  if (typeof value === 'string') return originalSafeEval(value);
  return value;
}

export function isPrimitive(val: any) {
  return !['object', 'function'].includes(typeof val) || val === null;
}

export function isEvaluable(value: any): boolean {
  if (isPrimitive(value)) return true;
  if (Array.isArray(value)) {
    return value.every(isEvaluable);
  } else if (_.isPlainObject(value)) {
    return Object.keys(value).every((key) => isEvaluable(value[key]));
  }
  return false;
}

/** 是否是字面量类型 */
export function isLiteralType(value: string) {
  value = value.trim()
  // 是空字符串
  if (!value) {
    return false
  }
  // 是 '"hi"' 这种情况
  if (value[0] === '"' && value.slice(-1) === '"') {
    return true
  }
  // 是 123 这种情况
  if (/^\d*(\.\d*)?$/.test(value)) {
    return true
  }

  if (value === 'false' || value === 'true') {
    return true
  }
  
  return false
}

export function extractLiteralType(value: string | number | boolean) {
  if (typeof value !== 'string') return value
  value = value.trim()
  // 是 "123" 这种情况
  if (/^\d*(\.\d*)?$/.test(value)) {
    return parseFloat(value)
  } else if (value === 'false') {
    return false
  } else if (value === 'true') {
    return true
  }
  // 是 '"hi"' 这种情况
  else {
    return value.slice(1, value.length - 1)
  }
}

export function isAtomicType(value: string) {
  value = value.trim()
  if (isLiteralType(value)) return true
  else if (['number','string','bool','any','symbol','null','void'].includes(value)) {
    return true
  } else {
    return false
  }
}

export function transformCode(code: any) {
  if (typeof code !== 'string') return code
  let outputText = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.None }}).outputText
  if (/;\n$/.test(outputText)) {
    return outputText.slice(0,-2)
  }
  else return outputText
}