import path from 'path'
import run from '../src/index'
import {Prop} from '../src/schema/type'

// 运行这个 demo 要先安装 "react": "17.0.2",

run(path.resolve(process.cwd(),'demo', 'component.tsx'), {workDir: process.cwd(), tsconfigFileName: 'demo.tsconfig.json'})
    .then((result: { props: Prop[] }) => {
        console.log(result)
    }, (error: any) => {
        console.error(error)
    })