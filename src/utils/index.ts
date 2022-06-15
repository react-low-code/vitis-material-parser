import spawn from 'cross-spawn-promise';
import originalSafeEval from 'safe-eval';
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