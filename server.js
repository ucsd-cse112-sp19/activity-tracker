
const express = require('express');
const port = 4000;

const server = express();

server.get('/', (req, res) => {
    res.send('This is the server');
});

server.listen(port, () => {
    console.log("Listening on port " + port);
});