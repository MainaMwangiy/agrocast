import axios from 'axios';
import React, { useState, useRef, useEffect } from 'react';

function App() {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [log, setLog] = useState("");
  const [systemInfo, setSystemInfo] = useState({});

  const startStream = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
      const recorder = new MediaRecorder(mediaStream, {
        mimeType: 'video/webm; codecs=vp9',
        videoBitsPerSecond: 2500000
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setChunks((prevChunks) => [...prevChunks, event.data]);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);

      logNetworkInfo();
    } catch (error) {
      console.error("Error accessing camera/microphone:", error);
    }
  };

  const stopStream = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setMediaRecorder(null);
      const blob = new Blob(chunks, { type: 'video/webm' });
      console.log('Recorded Blob:', blob);
      setChunks([]);
    }
  };

  const logNetworkInfo = () => {
    if (navigator.connection) {
      const { downlink, effectiveType } = navigator.connection;
      setLog(`Effective Network Type: ${effectiveType}\nDownlink Speed: ${downlink} Mbps`);
    } else {
      setLog('Network Information API is not supported in this browser.');
    }
  };

  const fetchSystemInfo = async () => {
    try {
      const response = await axios.get('http://localhost:5000/system-info', {
        headers: { 'Content-Type': 'application/json' },
      });
      setSystemInfo(response.data);
    } catch (error) {
      console.error('Error fetching system info:', error);
    }
  };


  useEffect(() => {
    const interval = setInterval(() => {
      fetchSystemInfo();
    }, 1000); // Fetch system info every second

    return () => clearInterval(interval);
  }, []);
  console.log("systemInfo", systemInfo)
  return (
    <div className="App">
      <h1>Live Stream with Optimization</h1>
      <video ref={videoRef} autoPlay style={{ width: '100%', height: 'auto' }}></video>
      <div>
        <button onClick={startStream} disabled={!!stream}>Start Streaming</button>
        <button onClick={stopStream} disabled={!stream}>Stop Streaming</button>
      </div>
      <div>
        <pre>{log}</pre>
      </div>
      {systemInfo && (
        <div>
          <h2>System Information</h2>
          <p>CPU Usage: {systemInfo.cpuUsage}</p>
          <p>Used Memory: {Math.round(systemInfo.usedMemory / 1024 / 1024)} MB</p>
          <p>Free Memory: {Math.round(systemInfo.freeMemory / 1024 / 1024)} MB</p>
          <p>Total Memory: {Math.round(systemInfo.totalMemory / 1024 / 1024)} MB</p>
          <h3>Network Information</h3>
          {Object.entries(systemInfo.networkInfo).map(([name, addresses]) => (
            <div key={name}>
              <h4>{name}</h4>
              {addresses.map((address, index) => (
                <p key={index}>{address}</p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
