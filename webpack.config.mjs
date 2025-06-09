const lazyImports = [
  '@nestjs/microservices/microservices-module',
  '@nestjs/websockets/socket-module',
];

export default {
  externals: [],
  output: {
    libraryTarget: 'commonjs2',
  },
  module: {
    rules: [
      {
        exclude: '/cdk/',
      },
    ],
  },
  plugins: [
    new webpack.IgnorePlugin({
      checkResource(resource) {
        if (lazyImports.includes(resource)) {
          try {
            require.resolve(resource);
          } catch {
            return true;
          }
        }
        return false;
      },
    }),
  ],
};
