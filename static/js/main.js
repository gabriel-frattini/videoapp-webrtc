let servers = {
  iceServers:[
      {
          urls:['stun:stun1.1.google.com:19302', 'stun:stun2.1.google.com:19302']
      }
  ]
}


let init = async () =>{

  localStream = await navigator.mediaDevices.getUserMedia({video: true, audio:true})

  document.getElementById("user-1").srcObject = localStream
  imageCapture = new ImageCapture(localStream.getVideoTracks()[0]);

  
}
init()


//user-1 video
const localVideo = document.querySelector('#user-1');
// var localStream = new MediaStream();

// ul of messages

// var endPoint = 'wss://'+window.location.host+'/ws/chat'
var endPoint = 'wss://videoapp-rtc.herokuapp.com/wss/chat'
console.log('endPoint',endPoint)
console.log('window host','wss://'+window.location.host+'/ws/chat')



var btnJoin = document.querySelector('#btn-join');

//dict for peers
mapPeers = {}


btnJoin.onclick = () => {
  var usernameInput = document.querySelector('#username');
  username = usernameInput.value;

  document.querySelector('#label-username').innerHTML = username;
  
  webSocket = new WebSocket(endPoint);

    webSocket.onopen = function(e){
        console.log('Connection opened! ', e);

        webSocket.onclose = function(e){
          console.log('Connection closed! ', e);
      }
      
      webSocket.onerror = function(e){
          console.log('Error occured! ', e);
      }

        // notify other peers
        sendSignal('new-peer', {'message':'hey from the client!'});
    }

    webSocket.onmessage = webSocketOnMessage;
}







// over the websocket connection
function sendSignal(action, message){
  webSocket.send(
      JSON.stringify(
          {
              'peer': username,
              'action': action,
              'message': message,
          }
      )
  )
}



function webSocketOnMessage(event){
  var parsedData = JSON.parse(event.data);

  var action = parsedData['action'];
  // username of other peer
  var peerUsername = parsedData['peer'];
  
  console.log('peerUsername: ', peerUsername);
  console.log('action: ', action);

  if(peerUsername == username){
    // ignore all messages from oneself
    return;
}


  var receiver_channel_name = parsedData['message']['receiver_channel_name'];
  console.log('receiver_channel_name: ', receiver_channel_name);

  // in case of new peer
  if(action == 'new-peer'){
    console.log('New peer: ', peerUsername);

    createOfferer(peerUsername, receiver_channel_name);

    return;
  }
  

  if(action == "new-offer"){
    console.log('Got a new offer from: ',peerUsername)

    var offer = parsedData["message"]["sdp"]
    console.log('Sneak Peek of the offer: ',offer)

    var peerConnection = createAnswerer(offer, peerUsername, receiver_channel_name)

    return;
  }

  if(action=='new-answer'){
    peerConnection = mapPeers[peerUsername][0];
  // get the answer
  var answer = parsedData['message']['sdp'];
  console.log('Answer is: ',answer)

  peerConnection.setRemoteDescription(answer)

  return;
  }
}



function createOfferer(peerUsername, receiver_channel_name){
  var peerConnection = new RTCPeerConnection(servers);


  addLocalTracks(peerConnection);

  // create and manage an RTCDataChannel
  var djangochannel = peerConnection.createDataChannel("channel");
  djangochannel.onopen = () => {
      console.log("Connection opened.");
  };

  var remoteVideo = document.querySelector('#user-2');
  setOnTrack(peerConnection, remoteVideo)
  console.log('Remote video source: ', remoteVideo.srcObject);

  mapPeers[peerUsername] = [peerConnection, djangochannel];

  peerConnection.onicecandidate = (event) => {
    if(event.candidate){
        console.log("New Ice Candidate: " + JSON.stringify(peerConnection.localDescription));
        return;
    }

    console.log('Gathering finished! Sending offer SDP to ', peerUsername, '.');
    console.log('receiverChannelName: ', receiver_channel_name);

    signal = {
      'sdp': peerConnection.localDescription,
      'receiver_channel_name': receiver_channel_name,
    }
    console.log('signal',signal)

    sendSignal('new-offer',signal)
  }

  peerConnection.createOffer()
        .then(o => peerConnection.setLocalDescription(o))
        .then(function(event){
            console.log("Local Description Set successfully.");
        });

    console.log('mapPeers[', peerUsername, ']: ', mapPeers[peerUsername]);

    return peerConnection;
}



function createAnswerer(offer, peerUsername, receiver_channel_name){

  var peerConnection = new RTCPeerConnection(servers);

  addLocalTracks(peerConnection)

  var remoteVideo = document.querySelector('#user-2');

  setOnTrack(peerConnection, remoteVideo);

  peerConnection.ondatachannel = e => {
    console.log('e.channel.label: ', e.channel.label);
    peerConnection.djangochannel = e.channel;
    peerConnection.djangochannel.onopen = () => {
        console.log("Connection opened.");
    }


    mapPeers[peerUsername] = [peerConnection, peerConnection.djangochannel];
  }

  peerConnection.onicecandidate = (event) => {
    if(event.candidate){
        console.log("New Ice Candidate! Reprinting SDP" + JSON.stringify(peerConnection.localDescription));
        return;
    }
    
    // event.candidate == null indicates that gathering is complete

    console.log('Gathering finished! Sending answer SDP to ', peerUsername, '.');
    console.log('receiverChannelName: ', receiver_channel_name);

    // send answer to offering peer
    // after ice candidate gathering is complete
    // answer needs to send two types of screen sharing data
    // local and remote so that offerer can understand
    // to which RTCPeerConnection this answer belongs
    sendSignal('new-answer', {
        'sdp': peerConnection.localDescription,
        'receiver_channel_name': receiver_channel_name,
    });
    }

    peerConnection.setRemoteDescription(offer)
        .then(() => {
            console.log('Set offer from %s.', peerUsername);
            return peerConnection.createAnswer();
        })
        .then(a => {
            console.log('Setting local answer for %s.', peerUsername);
            return peerConnection.setLocalDescription(a);
        })
        .then(() => {
            console.log('Answer created for %s.', peerUsername);
            console.log('localDescription: ', peerConnection.localDescription);
            console.log('remoteDescription: ', peerConnection.remoteDescription);
        })
        .catch(error => {
            console.log('Error creating answer for %s.', peerUsername);
            console.log(error);
        });

    return peerConnection


}



function addLocalTracks(peerConnection){

  // add user media tracks
      localStream.getTracks().forEach(track => {
          console.log('Adding localStream tracks.');
          peerConnection.addTrack(track, localStream);
      });

      return;
  }

  function setOnTrack(peerConnection, remoteVideo){
    console.log('Setting ontrack:');
    // create new MediaStream for remote tracks
    var remoteStream = new MediaStream();

    // assign remoteStream as the source for remoteVideo
    remoteVideo.srcObject = remoteStream;

    console.log('remoteVideo: ', remoteVideo.id);

    peerConnection.addEventListener('track', async (event) => {
        console.log('Adding track: ', event.track);
        remoteStream.addTrack(event.track, remoteStream);
    });
}



async function grabFrame() {
  const img = await imageCapture.grabFrame();

  imageCapture.takePhoto().then(function (blob) {   
    const url = URL.createObjectURL(blob)
    document.querySelector("#id_image").src = url                                 
    var imagen = new File([blob], "name",{contentType:"multipart/form-data"});

    var formData = new FormData();
    formData.append('image', imagen, "screenshot.jpg");
    apiurl = "http://127.0.0.1:8000/api/save_screenshot/"

    fetch(apiurl, 
      {
        method:"POST",
        body: formData
      }).then(
        response => response.json() 
      ).then(
        success => console.log(success) 
      ).catch(
        error => console.log(error)
  ).then(
    document.querySelector('#result').innerHTML = Math.round(Math.random()*100) + "%"
  )});
  
};
