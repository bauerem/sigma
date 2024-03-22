import React, { useState, useEffect } from 'react';
import ChatFrame from './chat-frame';
import ChatFloatingButton from './chat-floating-button';
import ChatTitleMsg from './chat-title-msg';
import ArrowIcon from './arrow-icon';
import {
  desktopTitleStyle,
  desktopWrapperStyle,
  mobileOpenWrapperStyle,
  mobileClosedWrapperStyle,
  desktopClosedWrapperStyleChat,
} from './style';

const setCookie = (conf) => {
  let date = new Date();
  let expirationTime = parseInt(conf.cookieExpiration);
  date.setTime(date.getTime() + expirationTime * 24 * 60 * 60 * 1000);
  let expires = '; expires=' + date.toGMTString();
  document.cookie = 'chatwasopened=1' + expires + '; path=/';
};

const getCookie = () => {
  var nameEQ = 'chatwasopened=';
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return false;
};

const wasChatOpened = () => {
  return getCookie() === false ? false : true;
};

function Widget(props) {
  const { conf, isMobile } = props;
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [pristine, setPristine] = useState(true);

  useEffect(() => {
    setPristine(false);
  }, []);

  const wrapperWidth = { width: conf.desktopWidth };
  const desktopHeight =
    window.innerHeight - 100 < conf.desktopHeight
      ? window.innerHeight - 90
      : conf.desktopHeight;
  const wrapperHeight = { height: desktopHeight };

  let wrapperStyle;
  if (!isChatOpen && (isMobile || conf.alwaysUseFloatingButton)) {
    wrapperStyle = { ...mobileClosedWrapperStyle }; // closed mobile floating button
  } else if (!isMobile) {
    wrapperStyle = conf.closedStyle === 'chat' || isChatOpen || wasChatOpened()
      ? isChatOpen
        ? { ...desktopWrapperStyle, ...wrapperWidth } // desktop mode, button style
        : { ...desktopWrapperStyle }
      : { ...desktopClosedWrapperStyleChat }; // desktop mode, chat style
  } else {
    wrapperStyle = mobileOpenWrapperStyle; // open mobile wrapper should have no border
  }

  const onClick = () => {
    setIsChatOpen(!isChatOpen);

    if (!isChatOpen && !wasChatOpened()) {
      setCookie(conf);
    }
  };

  return (
    <div style={wrapperStyle}>
      {/* Open/close button */}
      { (isMobile || conf.alwaysUseFloatingButton) && !isChatOpen  ? (
        <ChatFloatingButton color={conf.mainColor} onClick={onClick} />
      ) : conf.closedStyle === 'chat' || isChatOpen || wasChatOpened() ? (
        <div style={{ background: conf.mainColor, ...desktopTitleStyle }} onClick={onClick}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '0px 30px 0px 0px' }}>
            {isChatOpen ? conf.titleOpen : conf.titleClosed}
          </div>
          <ArrowIcon isOpened={isChatOpen} />
        </div>
      ) : (
        <ChatTitleMsg onClick={onClick} conf={conf} />
      )}

      {/* Chat IFrame */}
      <div
        style={{
          display: isChatOpen ? 'block' : 'none',
          height: isMobile ? '100%' : desktopHeight,
        }}
      >
        {pristine ? null : <ChatFrame {...props} />}
      </div>
    </div>
  );
}

export default Widget;
