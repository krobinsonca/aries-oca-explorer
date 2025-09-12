const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    trailingSlash: true,
    basePath: '/aries-oca-explorer',
    // https://nextjs.org/docs/api-reference/next.config.js/custom-webpack-config
    webpack: (config, { isServer }) => {
        config.resolve.alias['react-native$'] = 'react-native-web';
        
        // Handle problematic native dependencies
        config.resolve.fallback = {
            ...config.resolve.fallback,
            'rdf-canonize-native': false,
            'web-streams-polyfill/ponyfill/es2018': false,
            'stream': false,
            'crypto': false,
            'fs': false,
            'path': false,
            'os': false,
            'util': false,
        };
        
        // Ignore native modules that cause issues
        config.module.rules.push({
            test: /\.node$/,
            use: 'ignore-loader',
        });
        
        // Handle problematic imports
        config.plugins.push(
            new webpack.IgnorePlugin({
                resourceRegExp: /^(rdf-canonize-native|web-streams-polyfill\/ponyfill\/es2018)$/,
            })
        );
        
        return config;
    },
};

module.exports = nextConfig;
