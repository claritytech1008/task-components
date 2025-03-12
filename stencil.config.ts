import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'task-components',
  globalStyle: 'src/global/global.css',
  buildEs5: 'prod',
  devServer: {
    port: 3334
  },
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
      copy: [
        {
          src: 'assets',
          warn: true
        }
      ]
    },
    {
      type: 'dist-custom-elements'
    },
    {
      type: 'docs-readme'
    },
    {
      type: 'www',
      serviceWorker: null, // disable service workers
      copy: [
        {
          src: 'global'
        },
        {
          src: 'assets',
          dest: 'build/assets'
        }
      ]
    },
    {
      type: 'docs-vscode',
      file: 'vscode-data.json'
    },
  ]
};
