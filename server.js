// 1. Bring in the tools we downloaded
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// 2. Set up the server
const app = express();
const server = http.createServer(app);

// 3. Open the "socket" (the continuous phone line). We allow any device to connect.
const io = socketIo(server, { cors: { origin: "*" } });

// 4. This block of code runs every time a new device connects to our server
io.on('connection', (socket) => {
    console.log('A new device has connected! ID:', socket.id);

    // If the server receives a 'video_frame' from the Robot, it forwards it to the Web App
    socket.on('video_frame', (image_data) => {
        socket.broadcast.emit('video_frame', image_data);
    });

    // If the server receives a 'stop_command' from the Web App, it forwards it to the Robot
    socket.on('stop_command', () => {
        console.log('The STOP button was pressed! Telling the robot to stop...');
        socket.broadcast.emit('stop_command');
    });

    // If a device disconnects
    socket.on('disconnect', () => {
        console.log('A device disconnected.');
    });
});

// 5. Turn the server ON. It will listen on port 3000.
server.listen(3000, () => {
    console.log("SUCCESS: Cloud Server is running on port 3000!");
});