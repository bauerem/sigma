import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import Widget from './widget'; // Assuming your Widget component is in a file named Widget.js
import { defaultConfiguration } from './default-configuration';

function injectChat() {
  if (!window.intergramId) {
    console.error('Please set window.intergramId (see example at github.com/idoco/intergram)');
  } else {
    const root = document.createElement('div');
    root.id = 'intergramRoot';
    document.getElementsByTagName('body')[0].appendChild(root);
    const server = window.intergramServer || 'https://www.intergram.xyz';
    const iFrameSrc = server + '/chat.html';
    const host = window.location.host || 'unknown-host';
    const conf = { ...defaultConfiguration, ...window.intergramCustomizations };
    console.log("rendering widget");

    ReactDOM.render(
      <Widget
      intergramId={window.intergramId}
      host={host}
      isMobile={window.screen.width < 500}
      iFrameSrc={iFrameSrc}
      conf={conf}
      />,
      root
    );

    try {
      const request = new XMLHttpRequest();
      request.open('POST', server + '/usage-start?host=' + host);
      request.send();
    } catch (e) { /* Fail silently */ }
  }
}

if (window.attachEvent) {
  window.attachEvent('onload', injectChat);
} else {
  window.addEventListener('load', injectChat, false);
}

export default injectChat;
