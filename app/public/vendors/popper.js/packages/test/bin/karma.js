#!/usr/bin/env node
const path = require('path');
const { Server, config } = require('karma');

const karmaConfig = config.parseConfig(
  path.resolve(__dirname, '../karma.conf.js')
);

const server = new Server(karmaConfig, exitCode => {
  
  process.exit(exitCode);
});

server.start();
