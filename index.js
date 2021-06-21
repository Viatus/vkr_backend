require('dotenv').config();
const { callCalculateDistances } = require('./controllers/creationController');

const server = require('./server');

const PORT = process.env.PORT || 3300;

callCalculateDistances();

server.listen(PORT, () => console.log(`Server is live at localhost:${PORT}`));
