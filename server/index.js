const clientRoute = require('../routes/clientRoute');
const creationRoute = require('../routes/creationRoute');
const reviewRoute = require('../routes/reviewRoute');
const authorRoute = require('../routes/authorRoute');
const express = require('express');
const cors = require('cors');

const server = express();
server.use(cors())
server.use(express.json());

server.use(express.static(__dirname));

server.use('/', clientRoute);
server.use('/', creationRoute);
server.use('/', reviewRoute);
server.use('/', authorRoute);

module.exports = server;
