'use strict';

//Serwer lub klient mogą wysyłać także potwierdzenie odebrania eventu
//! server (emit) -> client (recieve) --acknowledgement -> server
//! client (emit) -> server (recieve)  --acknowledgement -> client

/*
 * W tym skrypcie za pomocą funkcji dostępnych z wcześniej wczytanego socket.io.js
 * łączymy się do serewera z poziomu klienta
 */
//socket zarówno po stronie serwera jak i klienta umożliwia wymienianie się danymi i odbieranie eventów
const socket = io();

/*
Wykona się gdy odebrany zostanie od servera event countUpdated
socket.on('countUpdated', (count) => {
  console.log(`The count has been updated: ${count}`);
});

document.querySelector('#countBtn').addEventListener('click', () => {
  console.log('Clicked');
  socket.emit('increment');
}); 
*/
const $form = document.querySelector('#formBroadcast');
const $formInput = $form.elements['message'];
const $formSubmit = $form.elements['submit'];
const $sendLocation = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
  //New message element
  const $newMessage = $messages.lastElementChild;

  //Height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  //Margin value
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  //Added to height of message
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
  //Visible height
  const visibleHeight = $messages.offsetHeight;
  //Height of messages container
  const containerHeight = $messages.scrollHeight;
  //How far scrolled
  const scrollOffset = $messages.scrollTop + visibleHeight;
  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

$form.onsubmit = (e) => {
  e.preventDefault();

  //Wyłączanie przycisku formy po przesłaniu wiadomości
  $formSubmit.setAttribute('disabled', 'disabled');
  //Funkcja wykonuje się gdy event został potwierdzony
  socket.emit('sendMessage', $formInput.value, (err) => {
    //Włączanie przycisku z powrotem w przypadku otrzymania potwierdzenia
    $formSubmit.removeAttribute('disabled');
    //Czyszczenie okna po wysłaniu wiadomości
    $formInput.value = '';
    $formInput.focus();
    if (err) return console.log(err);
    console.log('Message delivered!');
  });
};

$sendLocation.addEventListener('click', (e) => {
  e.preventDefault();

  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser!');
  }
  $formSubmit.setAttribute('disabled', 'disabled');
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      'sendLocation',
      { latitude: position.coords.latitude, longitude: position.coords.longitude },
      (message) => {
        console.log(message);
        $formSubmit.removeAttribute('disabled');
      }
    );
  });
});

socket.on('message', (message) => {
  console.log(message);
  //Generowanie wiadomości
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('k:mm:ss a'),
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('locationMessage', (url) => {
  const html = Mustache.render(locationTemplate, {
    username: url.username,
    location: url.url,
    createdAt: moment(url.createdAt).format('k:mm:ss a'),
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.querySelector('#sidebar').innerHTML = html;
});

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});
