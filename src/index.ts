// / <reference path="./type.d.ts" />
import parse from './parse/index'
import {Prop} from './schema/type'

export default async function run(componentAbsolutePath: string, args: {workDir: string, tsconfigFileName?: string}): Promise<{ props: Prop[] }> {
    const componentDocs = parse(componentAbsolutePath, args)
    return componentDocs[0]
}