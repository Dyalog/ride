#!/usr/bin/env node
/* eslint-disable import/no-extraneous-dependencies */
const { signAsync } = require('@electron/osx-sign');

const [app, identity] = process.argv.slice(2);
signAsync({
  app,
  identity,
  platform: 'darwin',
  strictVerify: false,
  optionsForFile: () => ({
    entitlements: './CI/packagescripts/osx/entitlements.plist',
    hardenedRuntime: true,
  }),
})
  .then(() => {
    console.log('Application signed');
  })
  .catch((err) => {
    console.error(err);
  });
