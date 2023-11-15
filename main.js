let peerConnection;
let localStream;
let remoteStream;
let dataChannel;

let servers = {
  iceServers: [
    {
      urls: ["stun:stun1.1.google.com:19302", "stun:stun2.1.google.com:19302"],
    },
  ],
};

let init = async () => {
  localStream = await navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: true,
    })
    .catch((error) => {
      if (error.name === "NotAllowedError") {
        let videos = document.getElementById("videos");
        let div = document.createElement("div");
        div.innerHTML = "Allow access to your camera !";
        div.classList.add("access-denied");
        videos.appendChild(div);
      }
      console.error(error);
    });

  document.getElementById("user-1").srcObject = localStream;
};

function muteAudio() {
  localStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  document.getElementById("audio").classList.toggle("fa-microphone");
}
function muteVideo() {
  localStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  document.getElementById("video").classList.toggle("fa-video");
}

const createDataChannel = async () => {
  dataChannel = await peerConnection.createDataChannel("chat-channel", {
    negotiated: true,
    id: 0,
  });

  dataChannel.onopen = () => {
    console.log("datachannel open");
    document.getElementById("connection-status").remove();
  };

  dataChannel.onclose = () => {
    console.log("datachannel close");
    let videos = document.getElementById("videos");
    let div = document.createElement("div");
    div.innerHTML = "Connection lost !";
    div.setAttribute("id", "connection-status");
    videos.appendChild(div);
  };
};

const createPeerConnection = async (sdpType) => {
  peerConnection = new RTCPeerConnection(servers);

  createDataChannel();

  remoteStream = new MediaStream();
  document.getElementById("user-2").srcObject = remoteStream;

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = async (event) => {
    console.log(event);
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      document.getElementById(sdpType).value = JSON.stringify(
        peerConnection.localDescription
      );
    }
  };
};

const createOffer = async () => {
  createPeerConnection("offer-sdp");

  if (!localStream) {
    return alert("Allow access to your camera to create an offer !");
  }

  let offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  document.getElementById("offer-sdp").value = JSON.stringify(offer);
};

const createAnswer = async () => {
  createPeerConnection("answer-sdp");

  let offer = document.getElementById("offer-sdp").value;
  if (!offer) return alert("Retrieve offer from peer first..");

  offer = JSON.parse(offer);
  await peerConnection.setRemoteDescription(offer);

  let answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  document.getElementById("answer-sdp").value = JSON.stringify(answer);
};

const addAnswer = async () => {
  let answer = document.getElementById("answer-sdp").value;
  if (!answer) return alert("Retrieve answer from peer first..");

  answer = JSON.parse(answer);

  if (!peerConnection.currentRemoteDescription) {
    peerConnection.setRemoteDescription(answer);
  }
};

init();

document.getElementById("create-offer").addEventListener("click", createOffer);
document
  .getElementById("create-answer")
  .addEventListener("click", createAnswer);
document.getElementById("add-answer").addEventListener("click", addAnswer);
document.getElementById("audio").addEventListener("click", muteAudio);
document.getElementById("video").addEventListener("click", muteVideo);
