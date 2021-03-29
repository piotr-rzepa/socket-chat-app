'use strict';

const users = [];

//addUser
const addUser = ({ id, username, room }) => {
  //Clean the data
  username = username.trim().toLowerCase();
  room = room.trim().toLowerCase();

  //Validate the data
  if (!username || !room) {
    return {
      error: 'Username and room are reqiured!',
    };
  }
  //Check for existing user
  const existingUser = users.find((user) => {
    return user.room === room && user.username === username;
  });

  //Validate username
  if (existingUser) {
    return {
      error: 'Username is already taken!',
    };
  }

  //Store user
  const user = { id, username, room };
  users.push(user);
  return { user };
};

//removeUser
const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) {
    //Usuwa element i zwraca go jako tablice ( w tym wypadku jeden element)
    return users.splice(index, 1)[0];
  }
};
//getUser
const getUser = (id) => {
  const user = users.find((user) => user.id === id);
  if (!user) return { error: 'User not found!' };
  return user;
};
//getUsersInRoom
const getUsersInRoom = (room) => {
  const validatedRoom = room.trim().toLowerCase();
  const usersInRoom = users.filter((user) => user.room === validatedRoom);
  return usersInRoom;
};

module.exports = { addUser, removeUser, getUser, getUsersInRoom };
