const request = require('request');
const cors = require('cors');
const bodyParser = require('body-parser');
const express = require('express');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);

// Initialize a WebSocket Server instance
const wss = new WebSocket.Server({ server });

const dotenv = require("dotenv")
dotenv.config()
const fetch = require("node-fetch");

globalThis.fetch = fetch
ChatGPT_API_dict = {}
last_audio = {}
chat_history = {}

// Track registered clients
const clients = {};

// Function to send a message to a specific user
function sendToUser(userId, chatId, message, type=null) {
    const clientSocket = clients[userId];
    if (clientSocket && clientSocket.readyState === WebSocket.OPEN) {
        let msg;
        if(type){
            msg = JSON.stringify({
                type,
                ...message
            });
        }
        else {
            msg = JSON.stringify({
                type: chatId + "-" + userId,
                ...message
            });
        }
        console.log("sent msg", msg);
        clientSocket.send(msg);
    }
}

// Function to broadcast a message to all connected users (you might adjust this to your needs)
function broadcast(chatId, message) {
    Object.values(clients).forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                chatId: chatId,
                ...message
            }));
        }
    });
}

runchatgpt = async (query, chatId, userId) => {

    //return "generic AI answer"; // for testing
    console.log("running chatgpt");

    const importDynamic = new Function( 'modulePath', 'return import(modulePath)', );
    const { ChatGPTAPI } = await importDynamic("chatgpt");
    const api = new ChatGPTAPI({ 
        apiKey: process.env.OPENAI_API_KEY,
        maxModelTokens: 4096,
        maxResponseTokens: 1000,
        completionParams: {
            model: 'gpt-3.5-turbo-1106', // 'gpt-4-1106-preview',
            temperature: 1, // default
            top_p: 1 // default
          },
        debug: true
        })

    const system_message = "You are a psycho-therapist. You are training psychology students how to be a psychologist. For this you are roleplaying. The roleplay only ends when the student says 'avocado pizza'. You are not allowed to say this. Ask the patient, be short, only one question at a time. In English.";

    let res
    // send a message and wait for the response
    if(chatId in ChatGPT_API_dict){
        const new_query = chat_history[chatId] + query;
        console.log(`continuing conversation for ${chatId}`);
        res = await api.sendMessage(new_query, {
            parentMessageId: ChatGPT_API_dict[chatId],
            max_tokens: 200,
            systemMessage: system_message
        });
        chat_history[chatId] = new_query + res.text;
    }
    else{
        console.log(`new conversation for ${chatId}`);
        res = await api.sendMessage(query, {
            max_tokens: 200,
            systemMessage: system_message
        });
        chat_history[chatId] = query + res.text;
    }
    ChatGPT_API_dict[chatId] = res.id;

    return res.text;
}

function createWebSocketPromise(ws, message) {
    return new Promise((resolve, reject) => {
        
        // Send the message to the WebSocket
        ws.send(JSON.stringify(message));

        ws.on('message', (data) => {
            // Parse and resolve the response
            const response = JSON.parse(data);
            resolve(response.text);
        });

        ws.on('error', (error) => {
            // Reject the promise if there's an error
            reject(error);
        });
    });
}

const process_query = (msg, chatId, userId) => {
    let promise;
    if(clients['GPT']){
        promise = createWebSocketPromise(clients['GPT'], { text: msg.text, chatId, userId });
    }
    else{
        promise = runchatgpt(msg.text, chatId, userId);
    }
    promise.then(AI_response => {
        const text = AI_response;

        sendToUser(userId, chatId, {from: "admin", text, name: "AI"});

        if(clients['TTS']){
            clients['TTS'].send(JSON.stringify({"chatId": chatId, "userId": userId, "text": text}));
        }
    });
}

server.listen(3000, () => {
    console.log("started http + websocket server on port 3000");
});

app.use(express.static('dist', {index: 'demo.html', maxage: '4h'}));
app.use(bodyParser.json());

// handle admin Telegram messages
app.post('/hook', function(req, res){
    try {
        const message = req.body.message || req.body.channel_post;
        console.log(message)
        const chatId = message.chat.id;
        const name = message.chat.first_name || message.chat.title || "admin";
        const text = message.text || "";
        const reply = message.reply_to_message;

        if (text.startsWith("/start")) {
            console.log("/start chatId " + chatId);
        } else if (reply) {
            let replyText = reply.text || "";
            let userId = replyText.split(':')[0];
            sendToUser(userId, chatId, {name, text, from: 'admin'});
        } else if (text){
            broadcast(chatId, {name, text, from: 'admin'});
        }

    } catch (e) {
        console.error("hook error", e, req.body);
    }
    res.statusCode = 200;
    res.end();
});

const forbidden_words = ["Tibet", "genocide", "Tiananmen"];

wss.on('connection', function connection(ws) {
    console.log('A client connected');

    ws.on('message', function incoming(message) {
        //console.log('received: %s', JSON.stringify(message));

        // J: somehow we receive binary despite stringify on client
        // Check if the message is a Buffer (binary data)
        if (message instanceof Buffer) {
            // Convert Buffer to string
            const messageString = message.toString('utf-8');
            //console.log('Converted string:', messageString);

            // Parse the string back into JSON
            try {
                message = JSON.parse(messageString);
                console.log('JSON message:', message);
            } catch (e) {
                console.error('Error parsing JSON:', e);
            }
        }

        const data = message; // Assuming all incoming messages are JSON
        userId = data.userId;
        chatId = data.chatId;
        console.log(chatId);
        console.log(userId)

        switch(data.type) {
            case 'registerGPT':
                clients['GPT'] = ws;
                console.log("GPT registered");
                break;
                
            case 'registerTTS':
                clients['TTS'] = ws;
                console.log("TTS registered");
                clients['TTS'].on('message', (data) => {
                    const parsedData = JSON.parse(data);
                    console.log('received from AI (TTS): %s', parsedData);
                    const audio = parsedData["audio"];
                    const text = parsedData["text"];
                    const timediff = (chatId in last_audio) ? new Date()-last_audio[chatId] : 88888888;
                    last_audio[chatId] = new Date(); // J: put this outside the timeout in case of concurrent requests
                    console.log(text);
                    console.log(timediff);
                    setTimeout(() => {
                        sendToUser(userId, chatId, {audio}, "voice"); 
                    }, timediff < 1000 ? 1000 : 0);               
                });
                break;
                
            case 'registerSR':
                clients['SR'] = ws;
                console.log("SR registered");
                clients['SR'].on('message', (data) => {
                    console.log(data);
                    const parsedData = JSON.parse(data);
                    console.log('received from AI (SR): %s', parsedData);
                    const text = parsedData["text"].replace("_POTENTIALLY_UNSAFE__","");
                    console.log(text);
                    sendToUser(userId, chatId, {name: "AI (TTS)", ...parsedData});
                    process_query(parsedData, chatId, userId);
                });
                break;
                
            case 'register':
                // Handle user registration
                if (!clients[userId]) {
                    clients[userId] = ws;
                    console.log(`userId ${userId} connected to chatId ${chatId}`);
                }
                break;
                
            case 'radio':
                // Handle audio message
                if(clients['SR']){
                    sendToUser(userId, chatId, {name: "Admin", text: "Processing audio..."});
                    clients['SR'].send(JSON.stringify({"chatId": chatId, "userId": userId, "audio": data.audio}));
                }
                else{
                    sendToUser(userId, chatId, {name: "Admin", text: "Transcription currently unavailable"});
                }
                break;
                
            case 'message':
                // Handle text message
                const { text } = data;
                // Perform your logic here
                console.log(`Message from ${userId} in chat ${chatId}: ${text}`);
                const msg = data;
                let visitorName = msg.visitorName ? "[" + msg.visitorName + "]: " : "";
            
                // Example of sending a message back to the user who sent the incoming message
                sendToUser(userId, chatId, msg);
                        
                if(forbidden_words.some(el => msg.text.toLowerCase().includes(el.toLowerCase()))) {
                    // Broadcast a message if it contains forbidden words
                    sendToUser(userId, chatId, {name: "Admin", text: `Your message contains inappropriate content. 您的消息包含不当内容.`, from: 'admin'});
                } else {
                    // Correct spelling using write-good
                    var writeGood = require('write-good');
                    var suggestions = writeGood(msg.text, { passive: false, whitelist: ['read-only'] });
                    console.log(suggestions);
                    if(suggestions.length > 0) {
                        const suggestions_str = suggestions.map((el) => el.reason).join(", ");
                        // 我有以下建议...
                        sendToUser(userId, chatId, {name: "Admin", text: `I have the following suggestions... ${suggestions_str}`, from: 'admin'});
                    }
            
                    // Send message to TTS if available
                    if(clients['TTS'] && clients['TTS'].readyState === WebSocket.OPEN) {
                        clients['TTS'].send(JSON.stringify({"chatId": chatId, "userId": userId, "text": msg.text}));
                    }
            
                    // Example call to process_query, assuming it's defined elsewhere
                    process_query(msg, chatId, userId);
                }
                break;   
        }
    });

    ws.on('close', function() {
        console.log('Client disconnected');
    });
});

app.post('/usage-start', cors(), (req, res) => {
    console.log('usage from', req.query.host);
    res.statusCode = 200;
    res.end();
});

// left here until the cache expires
app.post('/usage-end', cors(), (req, res) => {
    res.statusCode = 200;
    res.end();
});

app.get("/.well-known/acme-challenge/:content", (req, res) => {
    res.send(process.env.CERTBOT_RESPONSE);
});