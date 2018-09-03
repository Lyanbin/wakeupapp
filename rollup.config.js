// rollup.config.js
import babel from 'rollup-plugin-babel';

export default {
    input: 'lib/wakeUpApp.js',
    output: {
        file: 'wakeupapp.min.js',
        format: 'umd',
        name: 'wakeupapp'
    },
    plugins: [
        babel({
            exclude: 'node_modules/**' // 只编译我们的源代码
        })
    ]
};