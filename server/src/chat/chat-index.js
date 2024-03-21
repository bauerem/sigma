import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import Chat from './chat'; // Assuming your Chat component is in a file named Chat.js
import * as store from 'store2';

let conf = {};

const confString = getUrlParameter('conf');
if (confString) {
  try {
    conf = JSON.parse(confString);
  } catch (e) {
    console.log('Failed to parse conf', confString, e);
  }
}


const chatId = getUrlParameter('id');
const userId = getUserId();
const host = getUrlParameter('host');

ReactDOM.render(
  <Chat chatId={chatId} userId={userId} host={host} conf={conf} />,
  document.getElementById('SigmaChat')
  // Make sure your 'SigmaChat' element exists in your HTML
);


function getUrlParameter(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  let regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  let results = regex.exec(window.location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

function getUserId() {
  if (store.enabled) {
    return store.get('userId') || store.set('userId', generateRandomId());
  } else {
    return generateRandomId();
  }
}

function generateRandomId() {
  return Math.random().toString(36).substr(2, 6);
}