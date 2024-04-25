// Server-side code

var express = require('express');
var app = express();
var http = require('http').createServer(app);
const io = require('socket.io')(http);

// Creating connection array
var connections = [];
let number = 1;

// Establishing io connection
io.on("connect", (socket) => {
    // Add the joined user as new connection in connections array
    connections.push(socket);
    // Display joined player status
    console.log(`Ninja ${number} has connected`);
    number = number + 1;

    // Syncing output in real-time among all connections
    socket.on("output", (o) => {
        socket.broadcast.emit("output", o);
    })

    // Syncing updated code in real-time among all connections 
    socket.on("codeChange", (newCode) => {
        socket.broadcast.emit("codeChange", newCode);
    })

    // Syncing joined player logos in real-time among all connections
    socket.on('joinuser', (username) => {
        socket.broadcast.emit('joinuser', username);
    })

    // Display disconnected player status
    socket.on("disconnect", (reason) => {
        console.log(`Ninja ${number} is disconnected`);
        connections = connections.filter((con) => con.id !== socket.id);
    })

})

// Starting express app using public directory
app.use(express.static("public"));

// Exposing port and displaying server start message
var PORT = process.env.YOUR_PORT || process.env.PORT || 8080;
http.listen(PORT, () => {
    console.log("Server started on port " + PORT);
})