/* eslint prefer-arrow-callback: 0 */
const path = require('path');
const fs = require('fs');
const serve = require('webpack-serve');
const { resolve } = require('path');
const views = require('koa-views');
const getWebpackConfig = require('../config/getWebpackConfig');
const routes = require('./routes');

module.exports = function startServer(opts) {
  const pkgPath = path.resolve(opts.cwd, 'package.json');

  return Promise.resolve()
    .then(() => {
      const entry = {
        __Component_Dev__: './src'
      };
      const config = getWebpackConfig(entry);
      Object.assign(config.output, {
        library: '__Component__',
        libraryTarget: 'umd',
      });

      return serve({
        config,
        dev: {
          stats: {
            colors: true,
            modules: false,
            chunks: false,
            entrypoints: false
          },
        },
        add: (app, middleware, options) => {
          // since we're manipulating the order of middleware added, we need to handle
          // adding these two internal middleware functions.
          middleware.webpack();
          middleware.content();

          app.use(async function (ctx, next) {
            ctx.compiler = options.compiler;
            ctx.projectDir = opts.cwd;
            await next();
          });
          app.use(
            views(resolve(__dirname, '../template'), {
              map: { html: 'hbs', hbs: 'handlebars' },
              options: {
                helpers: {
                  toJSON: (obj) => (JSON.stringify(obj, null, 2) || '').trim(),
                },
              },
            })
          );
          // router *must* be the last middleware added
          app.use(routes);
        },
      });
    })
    .then((server) => {
      server.on('Component Dev Server Listening', () => { });
    });
};
