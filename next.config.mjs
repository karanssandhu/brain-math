/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.worker\.js$/,
      use: { loader: 'worker-loader' },
    });
    return config;
  },
};

export default nextConfig;


// module.exports = {
//   webpack: (config) => {
//     config.module.rules.push({
//       test: /\.worker\.js$/,
//       use: { loader: 'worker-loader' },
//     });
//     return config;
//   },
// };

