// / <reference path="./type.d.ts" />
import { install, installModule } from './utils/index.js'
import parse from './parse/index.js'

async function run(componentAbsolutePath: string, args: {workDir: string, tsconfigFileName?: string}) {
    await install({
        workDir: args.workDir
    })

    await installModule({
        workDir: args.workDir
    }, '@types/react@17.0.2')

    const componentDocs = parse(componentAbsolutePath, args)
    return componentDocs[0]
}

export default run