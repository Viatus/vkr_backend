const clientRoute = require('../routes/clientRoute');
const creationRoute = require('../routes/creationRoute');
const express = require('express');
const cors = require('cors');

const server = express();
server.use(cors())
server.use(express.json());

server.use('/', clientRoute);
server.use('/', creationRoute);

module.exports = server;
