'use strict';

const createMessage = (textBody, username = 'Admin') => {
  return {
    username,
    text: textBody,
    createdAt: new Date().getTime(),
  };
};

const createMessageLocation = (username, textBody) => {
  return {
    username,
    url: textBody,
    createdAt: new Date().getTime(),
  };
};

module.exports = { createMessage, createMessageLocation };
