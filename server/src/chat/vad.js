// does not build, use global import via window.vad instead
//import { useMicVAD, utils } from "@ricky0123/vad-react"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"

const Demo = ({sendSpeech, speaking}) => {
  const [demoStarted, setDemoStarted] = useState(false)

  return (
    <div className="pb-2">
      {!demoStarted && (
        <StartDemoButton startDemo={() => setDemoStarted(true)} />
      )}
      {demoStarted && <ActiveDemo sendSpeech={sendSpeech} speaking={speaking}/>}
    </div>
  )
}

export default Demo;

function StartDemoButton({ startDemo }) {
  return (
    <div className="flex justify-center">
      <button
        style={{margin: "5px"}}
        onClick={startDemo}
        className="text-xl text-black font-bold px-3 py-2 rounded bg-gradient-to-r from-pink-600 to-rose-600 hover:from-slate-800 hover:to-neutral-800 hover:text-white"
      >
        Start recording
      </button>
    </div>
  )
}

let chunks;
let mediaRecorder;
function ActiveDemo({sendSpeech, speaking}) {
  const [audioList, setAudioList] = useState([]);
  const [vad, setVAD] = useState(null);
  const [listening, setListening] = useState(false);
  const [listeningDisabled, setListeningDisabled] = useState(false);
  const [userSpeaking, setSpeaking] = useState(false);

  useEffect(async () => {
    const loaded_vad = await window.vad.MicVAD.new({
      redemptionFrames: 16,
      preSpeechPadFrames: 16,
      positiveSpeechThreshold: 0.5,
      startOnLoad: false,
      onSpeechStart: (audio) => {
        console.log("speech started");
        setSpeaking(true);

        // J: hack due to weird buffers
        var constraints = { audio: true };
        navigator.mediaDevices.getUserMedia(constraints).then((mediaStream) => {
          mediaRecorder = new MediaRecorder(mediaStream);
          mediaRecorder.onstart = (e) => {
              chunks = [];
          };
          mediaRecorder.ondataavailable = (e) => {
              //console.log(this.chunks)
              chunks.push(e.data);
          };
          mediaRecorder.onstop = (e) => {
            //J: sending here cuts off the beginning of the audio
            //sendSpeech(chunks);
          };
        mediaRecorder.start();
      });
      },
      onSpeechEnd: (audio) => {
        console.log("speech ended");
        const wavBuffer = window.vad.utils.encodeWAV(audio);
        //J: all not working
        //const sampleRate = 44100; // Your actual sample rate
        //const bitpcm = window.vad.utils.encodeWAV(audio, 0, sampleRate);
        //sendSpeech(audio);
        const base64 = window.vad.utils.arrayBufferToBase64(wavBuffer);
        // J: send as base64
        sendSpeech(base64);
        const url = `data:audio/wav;base64,${base64}`;
        setAudioList((old) => [url, ...old]);
        setSpeaking(false);

        mediaRecorder.stop();
      },
    });
    loaded_vad.start();
    setListening(true);
    console.log(loaded_vad);
    setVAD(loaded_vad);
  }, []);

  useEffect(() => {
    if(vad){
      if((vad.listening && speaking) || listeningDisabled){
        vad.pause();
        setListening(false);
      }
      else{
        vad.start();
        setListening(true);
      }
    }
  }, [speaking]);

  if (!vad) {
    return <Loading />
  }

  if (vad && vad.errored) {
    return <Errored />
  }

  const toggle = () => {
    if(vad.listening){
      vad.pause();
      setListening(false);
      setListeningDisabled(true);
    }
    else{
      vad.start();
      setListening(true);
      setListeningDisabled(false);
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="w-48 flex items-center">
        <div className="w-24 flex justify-center items-center">
          {listening && userSpeaking && <HighEnergyCube />}
          {listening && !userSpeaking && <LowEnergyCube />}
          {!listening && <DeactivatedCube />}
        </div>
        <div className="w-24 flex justify-start items-center">
          <div
            className="underline underline-offset-2 text-rose-600 grow"
            onClick={toggle}
          >
            {listening && <button style={{margin: "5px"}}>Pause</button>}
            {!listening && <button style={{margin: "5px"}}>Start</button>}
          </div>
        </div>
      </div>
      <ul
        id="playlist"
        className="self-center pl-0 max-h-[400px] overflow-y-auto no-scrollbar list-none"
      >
        {audioList.slice(0, 1).map((audioURL) => {
          return (
            <li className="pl-0" key={audioItemKey(audioURL)}>
              <audio src={audioURL} controls />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const audioItemKey = (audioURL) => audioURL.substring(-10)

function Loading() {
  return (
    <div className="flex justify-center">
      <div className="animate-pulse text-2xl text-rose-600">Loading</div>
    </div>
  )
}

function Errored() {
  return (
    <div className="flex justify-center">
      <div className="text-2xl text-rose-600">Something went wrong</div>
    </div>
  )
}

const DeactivatedCube = () => {
  return (
    <div className="bg-gradient-to-l from-[#2A2A2A] to-[#474747] h-10 w-10 rounded-[6px]" />
  )
}

const LowEnergyCube = () => {
  return (
    <motion.div className="bg-gradient-to-l from-[#7928CA] to-[#008080] h-10 w-10 rounded-[6px] low-energy-spin" />
  )
}

const HighEnergyCube = () => {
  return (
    <motion.div className="bg-gradient-to-l from-[#7928CA] to-[#FF0080] h-10 w-10 rounded-[6px] high-energy-spin" />
  )
}