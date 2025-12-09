import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({mode}) => {
    const env = loadEnv(mode, '.', '');
    return {
        server: {
            port: 80,
            host: '0.0.0.0',
            proxy: {
                '/sdap4mysql': { // 匹配请求路径
                    target: 'https://frp-fan.com:64952', // 目标服务器地址
                    changeOrigin: true, // 修改 Host 头，欺骗后端
                    secure: false, // 如果目标是 https 且证书自签名，需要设为 false
                    // rewrite: (path) => path.replace(/^\/api/, '') // 根据情况选择是否重写路径
                }
            }
        },
        plugins:
            [react()],
        define:
            {
                'process.env.API_KEY':
                    JSON.stringify(env.GEMINI_API_KEY),
                'process.env.GEMINI_API_KEY':
                    JSON.stringify(env.GEMINI_API_KEY)
            }
        ,
        resolve: {
            alias: {
                '@':
                    path.resolve(__dirname, '.'),
            }
        }
    }
        ;
});
