import path from 'path'
import run from '../src/index.js'

// 运行这个 demo 要先安装 "react": "17.0.2",

run(path.resolve(process.cwd(),'demo', 'component.tsx'), {workDir: process.cwd(), tsconfigFileName: 'demo.tsconfig.json'})
    .then(result => {
        console.log(result)
    }, (error) => {
        console.error(error)
    })