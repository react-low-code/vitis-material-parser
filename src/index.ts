// / <reference path="./type.d.ts" />
import { resolve } from 'path';
import fs from 'fs-extra';
import parse from './parse/index'

export default async function run(componentAbsolutePath: string, args: {workDir: string, tsconfigFileName?: string}): Promise<string> {
    const componentDocs = parse(componentAbsolutePath, args)
    const { componentConfig = {}, version = '0.0.0', description, name } = JSON.parse(fs.readFileSync( resolve(process.cwd(), 'package.json'), {encoding: 'utf-8'} ))
    return JSON.stringify(
        {
          componentName: componentConfig.name || '',
          packageName: name,
          title: componentConfig.title || '',
          iconUrl: componentConfig.iconUrl || '',
          description,
          docUrl:`https://unpkg.com/${name}@${version}/docs/index.html`,
          version: version,
          props: componentDocs[0] ? componentDocs[0].props: '',
          // "base"|"layout"|"subjoin"，描述该组件位于组件面板中哪个区域
          group: 'subjoin',
          advanced: {
            // 组件的嵌套规则
            nestingRule: {
              // 父级组件白名单
              // 业务组件必须放置在布局组件中
              parentWhitelist: ['LayoutColumn'],
              // 子组件白名单。
              // 空数组则说明其他组件不能放置在该组件中
              childWhitelist: []
            },
            supports: {
              // 是否能配置样式
              styles: true,
              // 是否能配置校验规则
              validation: false,
              // 是否能配置联动规则
              linkage: false,
              // 支持的事件列表
              events: ['onClick']
            },
            // 容器类型，容器能有自己的数据源
            // false | 'Page' | 'Block' | 'DataBlock'
            containerType: false,
            // 是否是表单组件
            isFormControl: false,
            // 是否是布局组件
            isLayout: false
          },
        },
        null,
        2,
    )
}