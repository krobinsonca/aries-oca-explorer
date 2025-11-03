const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Only use static export in production (allows API routes/rewrites in dev)
    ...(process.env.NODE_ENV === 'production' && { output: 'export' }),
    trailingSlash: true,
    // Disable image optimization for static export
    images: {
        unoptimized: true,
    },
    // Rewrites for API proxying (works in dev mode)
    async rewrites() {
        // Only use rewrites in development (not for static export)
        if (process.env.NODE_ENV === 'development') {
            return [
                {
                    source: '/api/candyscan/transactions/:path*',
                    destination: 'https://candyscan.idlab.org/txs/:path*',
                },
            ];
        }
        return [];
    },
    // Only use basePath and assetPrefix in production (for GitHub Pages)
    ...(process.env.NODE_ENV === 'production' && {
        basePath: '/aries-oca-explorer',
        assetPrefix: '/aries-oca-explorer',
    }),
    // https://nextjs.org/docs/api-reference/next.config.js/custom-webpack-config
    webpack: (config, { isServer }) => {
        config.resolve.alias = {
            ...config.resolve.alias,
            'react-native$': 'react-native-web',
            'class-validator': require.resolve('class-validator'),
        };
        
        // Handle problematic native dependencies
        config.resolve.fallback = {
            ...config.resolve.fallback,
            'rdf-canonize-native': false,
            'web-streams-polyfill/ponyfill/es2018': false,
            'react-native-fs': false,
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
                resourceRegExp: /^(rdf-canonize-native|web-streams-polyfill\/ponyfill\/es2018|react-native-fs)$/,
            })
        );
        
        return config;
    },
};

module.exports = nextConfig;
