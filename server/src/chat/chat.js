import React from 'react';
import MessageArea from './message-area';
import * as store from 'store2';
import VAD from './vad.js';

window.currentTime = -1;
window.audioID = 0;
window.audioID_played = 0;

class Chat extends React.Component {

  constructor(props) {
    super(props);
    if (store.enabled) {
        this.messagesKey = 'messages' + '.' + props.chatId + '.' + props.host;
        this.state = {messages: store.get(this.messagesKey) || store.set(this.messagesKey, []),  recording: false, speaking: false, audioCounter: 0};
    } else {
        this.state = {messages: [], recording: false, speaking: false, audioCounter: 0};
    }
  }

  sendSpeech = (base64data) => {
      console.log(base64data);
      const msg = JSON.stringify({type: 'radio', audio: base64data, chatId: this.props.chatId, userId: this.props.userId});
      console.log("msg", msg)
      this.socket.send(msg);
      console.log("audio sent");
  }

  base64ToArrayBuffer = (base64) => {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++)        {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }

  processVoice = (base64data) => {
    const arrayBuffer = this.base64ToArrayBuffer(base64data)
    this.setState({speaking: true, audioCounter: this.state.audioCounter+1});
    const audioID_local = document.getElementById("info").getAttribute("audioID");
    document.getElementById("info").setAttribute("audioID", parseInt(audioID_local) + 1);  

    const func = () => {
        console.log(document)
        // J: somehow this rubbish does not update the global variable, nor the window
        let currentTime = document.getElementById("info").getAttribute("currentTime");
        let audioID_played = document.getElementById("info").getAttribute("audioID_played");
        if(currentTime == -1 && audioID_played == audioID_local){
            currentTime = 888;
            var blob = new Blob([arrayBuffer], { 'type' : 'audio/ogg; codecs=opus' });
            var audio = document.createElement('audio');
            audio.src = window.URL.createObjectURL(blob);
            audio.play();
            audio.addEventListener("ended", ()=>{
                currentTime = -1;
                audioID_played = parseInt(audioID_played) + 1;
                console.log("audio ended");
                if(this.state.audioCounter == 1){
                  this.setState({audioCounter: 0, speaking: false});
                }
                else {
                  this.setState({audioCounter: this.state.audioCounter-1});
                }
                setTimeout(() => {
                    document.getElementById("info").setAttribute("currentTime", currentTime);
                    document.getElementById("info").setAttribute("audioID_played", audioID_played);
                }, 0);
            });    
        }
        else{
            console.log("checking ", currentTime, audioID_played, audioID_local);
            setTimeout(func, 100); 
        }
    }
    func();
  }

  componentDidMount() {

    // Determine the WebSocket URL based on the current location
    let wsUrl;
    if (window.location.protocol === 'https:') {
        wsUrl = 'wss://' + window.location.host; // Use wss:// for secure connections
    } else {
        wsUrl = 'ws://' + window.location.host; // Use ws:// for non-secure connections
    }

    // Establish a WebSocket connection
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      const msg = JSON.stringify({type: "register", chatId: this.props.chatId, userId: this.props.userId });
      console.log("msg", msg)
      this.socket.send(msg);
    };
    this.socket.onmessage = (e) => {
      const data = e.data;
      const parsedData = JSON.parse(data)
      console.log("data is", data);
      console.log(this.props.chatId+'-'+this.props.userId);
      console.log('data.type:', parsedData.type);

      const chatId_userId = this.props.chatId+'-'+this.props.userId;

      switch(parsedData.type) {
        case "message":
          this.incomingMessage(parsedData);
          break;

        case this.props.chatId: // J: seems not used anymore
          this.incomingMessage(parsedData);
          break;
      
        case chatId_userId:
          this.incomingMessage(parsedData);
          break;

        case 'voice':
          this.processVoice(parsedData.audio);
          break;
      }
          
    }

    if (!this.state.messages.length) {
        this.writeToMessages({text: this.props.conf.introMessage, from: 'admin'});
    }

    // When the client receives a voice message it will play the sound
    console.log("registered voice handler")

    document.getElementById("info").setAttribute("currentTime", -1);
    document.getElementById("info").setAttribute("audioID_played", 0);
    document.getElementById("info").setAttribute("audioID", 0);
  }

  handleKeyPress = (e) => {
    //console.log("keypress", e.key, this.input.value);
    // J: e.keyCode is always 0 --> maybe deprecated
    if (e.key == "Enter" && this.input.value) {
        let text = this.input.value;
        const msg = JSON.stringify({
          type: "message", 
          text, 
          from: 'visitor', 
          visitorName: this.props.conf.visitorName,
          chatId: this.props.chatId, 
          userId: this.props.userId
        });
        console.log("msg", msg);
        this.socket.send(msg);

        this.input.value = '';

        if (this.autoResponseState === 'pristine') {

            setTimeout(() => {
                this.writeToMessages({
                    text: this.props.conf.autoResponse,
                    from: 'admin'});
            }, 500);

            this.autoResponseTimer = setTimeout(() => {
                this.writeToMessages({
                    text: this.props.conf.autoNoResponse,
                    from: 'admin'});
                this.autoResponseState = 'canceled';
            }, 60 * 1000);
            this.autoResponseState = 'set';
        }
    }
  };

  incomingMessage = (msg) => {
      this.writeToMessages(msg);
  };

  writeToMessages = (msg) => {
      
      msg.time = new Date();
      const messages = [...this.state.messages, msg];
      console.log("adding message", messages);
      this.setState({
          messages
      });

      if (store.enabled) {
          try {
              store.transact(this.messagesKey, function (messages) {
                  messages.push(msg);
              });
          } catch (e) {
              console.log('failed to add new message to local storage', e);
              store.set(this.messagesKey, [])
          }
      }
  }

  render(){
    return (
    <div>
      <MessageArea messages={this.state.messages} conf={this.props.conf} />
      <div>
        <input 
          className="textarea" 
          type="text" 
          placeholder={"Send a message..."} 
          onKeyPress={this.handleKeyPress} 
          ref={(input) => { this.input = input }}
        />
      </div>
      <div style={{ position: "fixed", bottom: "50px" }}>
        <VAD sendSpeech={this.sendSpeech} speaking={this.state.speaking}/>
        <span style={{ padding: "5px" }}>{this.state.speaking ? "AI speaking" : "AI not speaking"}</span>
      </div>
      <a className="banner" target="_blank">
        Created by <b>Sigma4Strife</b>&nbsp;
      </a>
    </div>
  );
  }

}

export default Chat;
