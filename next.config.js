/** @type {import('next').NextConfig} */
const nextConfig = {
    // https://nextjs.org/docs/api-reference/next.config.js/custom-webpack-config
    webpack: (config, { }) => {
        config.resolve.alias['react-native$'] = 'react-native-web'
        return config
    },
}

module.exports = nextConfig
