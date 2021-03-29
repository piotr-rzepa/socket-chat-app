'use strict';
const path = require('path');
const express = require('express');
const http = require('http');
const socket_io = require('socket.io'); //Support dla socket.io
const Filter = require('bad-words');
const { createMessage, createMessageLocation } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const app = express();
const server = http.createServer(app);
/*
 *  socket io wymaga od nas serwera http, który express tworzy niejawnie,
 *  dlatego musimy go sami wyraźnie zainicjować
 */
const io = socket_io(server);

const port = process.env.PORT || 3000;

const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));

//! server (emit) -> client (recieve) - countUpdated
//! client (emit) -> server (recieve) - increment
// parametr socket zawiera informacje o połączeniu
io.on('connection', (socket) => {
  console.log('New connection');

  //Dołączanie do serwera
  socket.on('join', (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });
    if (error) {
      return callback(error);
    }
    //socket.join() -> możliwe wyłącznie po stronie serwera
    socket.join(user.room);
    socket.emit('message', createMessage('Welcome user!'));
    socket.broadcast.to(user.room).emit('message', createMessage(`${user.username} has joined!`));
    io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
    callback();
  });

  //Wwywołujemy callback aby potwierdzić odbiór eventu
  socket.on('sendMessage', (message, callback) => {
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback('Profanity is now allowed!');
    }
    const user = getUser(socket.id);
    io.to(user.room).emit('message', createMessage(message, user.username));
    callback();
  });

  socket.on('sendLocation', (location, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit(
      'locationMessage',
      createMessageLocation(
        user.username,
        `https://google.com/maps?q=${encodeURIComponent(location.latitude)},${encodeURIComponent(location.longitude)}`
      )
    );
    callback('Location shared!');
  });
  //Wysyłanie danych do klienta za pomocą eventów przy połączeniu
  /* socket.emit('countUpdated', count);

  socket.on('increment', () => {
    count = count + 1;
    ! socket.emit -> wysyła tylko do klienta od którego oderano event
    socket.emit('countUpdated', count);
    ! io.emit -> wysyła event do wszystkich podłączonych klientów
    io.emit('countUpdated', count); 
    ! socket.broadcast -> wysyła event do wszystkich OPRÓCZ danego klienta
    ! io.to.emit -> wysyła event do każdego w danym pokoju
    ! socket.broadcast.to.emit -> wysyła event do każdego w pokoju oprócz tego klienta
  }); */

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);
    if (user) {
      //Nie trzeba używać broadcast, ponieważ dany user już wyszedł
      io.to(user.room).emit('message', createMessage(`${user.username} has left!`));
      io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
    }
  });
});

server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
