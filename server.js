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
    socket.data.role = null;

    socket.on('register_role', (payload) => {
        const role = payload && typeof payload.role === 'string' ? payload.role : null;
        if (role !== 'robot' && role !== 'dashboard') {
            console.log('Rejected invalid role registration from', socket.id, payload);
            return;
        }

        socket.data.role = role;
        console.log(`Socket ${socket.id} registered as role=${role}`);
    });

    // If the server receives a 'video_frame' from the robot, it forwards it to dashboards only.
    socket.on('video_frame', (imageData) => {
        if (socket.data.role !== 'robot') {
            console.log(`Ignoring video_frame from non-robot socket ${socket.id}`);
            return;
        }

        io.sockets.sockets.forEach((peerSocket) => {
            if (peerSocket.id !== socket.id && peerSocket.data.role === 'dashboard') {
                peerSocket.emit('video_frame', imageData);
            }
        });
    });

    socket.on('telemetry', (telemetry) => {
        if (socket.data.role !== 'robot') {
            console.log(`Ignoring telemetry from non-robot socket ${socket.id}`);
            return;
        }

        io.sockets.sockets.forEach((peerSocket) => {
            if (peerSocket.id !== socket.id && peerSocket.data.role === 'dashboard') {
                peerSocket.emit('telemetry', telemetry);
            }
        });
    });

    // If the server receives a 'stop_command' from the web app, it forwards it to robots only.
    socket.on('stop_command', (payload) => {
        if (socket.data.role !== 'dashboard') {
            console.log(`Ignoring stop_command from non-dashboard socket ${socket.id}`);
            return;
        }

        console.log('The STOP button was pressed! Telling the robot to stop...');
        io.sockets.sockets.forEach((peerSocket) => {
            if (peerSocket.id !== socket.id && peerSocket.data.role === 'robot') {
                peerSocket.emit('stop_command', payload || {});
            }
        });
    });

    socket.on('clear_stop_command', (payload) => {
        if (socket.data.role !== 'dashboard') {
            console.log(`Ignoring clear_stop_command from non-dashboard socket ${socket.id}`);
            return;
        }

        console.log('The CLEAR STOP button was pressed! Telling the robot to release estop...');
        io.sockets.sockets.forEach((peerSocket) => {
            if (peerSocket.id !== socket.id && peerSocket.data.role === 'robot') {
                peerSocket.emit('clear_stop_command', payload || {});
            }
        });
    });

    // If a device disconnects
    socket.on('disconnect', () => {
        console.log(`A device disconnected. ID=${socket.id} role=${socket.data.role}`);
    });
});

// 5. Turn the server ON. It will listen on port 3000.
server.listen(3000, () => {
    console.log("SUCCESS: Cloud Server is running on port 3000!");
});
