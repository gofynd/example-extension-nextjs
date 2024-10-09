'use strict';

const { startServer} = require("./server");

startServer().catch((error) => {
    console.error('Error starting server:', error);
});