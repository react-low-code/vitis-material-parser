// / <reference path="./type.d.ts" />
import { resolve } from 'path';
import fs from 'fs-extra';
import parse from './parse/index'

export default async function run(componentAbsolutePath: string, args: {workDir: string, tsconfigFileName?: string}): Promise<string> {
    const componentDoc = parse(componentAbsolutePath, args)[0] || {}
    const { componentConfig = {}, version = '0.0.0', description, name } = JSON.parse(fs.readFileSync( resolve(process.cwd(), 'package.json'), {encoding: 'utf-8'} ))
    // 如果该组件能接受 children 属性就说明它是容器组件
    const isContainer = !!(componentDoc.props||[]).find(prop => prop.name === 'children')
    // children 不在属性面板中配置，而是从组件面板中拖入，所以这里去掉 children 属性
    componentDoc.props = isContainer ? componentDoc.props.filter(prop => prop.name !== 'children'): componentDoc.props
    // 该组件是否能接受样式
    const isSupportStyle = !!(componentDoc.props||[]).find(prop => prop.name === 'style')
    // 样式在属性面板中配置，而是在样式面板中配置，所以这里去掉 style 属性
    componentDoc.props = isContainer ? componentDoc.props.filter(prop => prop.name !== 'style'): componentDoc.props

    return JSON.stringify(
        {
          componentName: componentConfig.name || '',
          packageName: name,
          title: componentConfig.title || '',
          iconUrl: componentConfig.iconUrl || '',
          description,
          docUrl:`https://unpkg.com/${name}@${version}/docs/index.html`,
          version: version,
          props: componentDoc.props ? componentDoc.props: [],
          // "base"|"layout"|"subjoin"，描述该组件位于组件面板中哪个区域
          group: 'subjoin',
          advanced: {
            // 组件的嵌套规则
            nestingRule: {
              // 父级组件白名单
              // 非容器组件必须放置在容器组件中
              parentWhitelist: isContainer ? ['Page']: ['Layout-*'],
              // 子组件白名单。
              // 空数组则说明其他组件不能放置在该组件中, undefined 则说明其他组件能放置在该组件中
              childWhitelist: isContainer ? undefined: []
            },
            supports: {
              // 是否能配置样式
              styles: isSupportStyle,
              // 是否能配置校验规则
              validation: false,
              // 是否能配置联动规则
              linkage: false,
              // 支持的事件列表，空数组意味着不支持任何事件
              events: []
            },
            component: {
              // 是否是容器
              isContainer: isContainer,
              // 容器类型，非必填，可选值：‘Layout’、‘Data’、‘Page’
              containerType: isContainer ? 'Layout': undefined,
              // 是否是表单组件
              isFormControl: false,
             },
          },
        },
        null,
        2,
    )
}