//Client-side code

// Creating io connection
var io = io.connect();

// Generate new room ID
function generateRoomID() {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789#@$%';
  const roomIdLength = 5;
  let roomId = '';

  for (let i = 0; i < roomIdLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    roomId += characters[randomIndex];
  }

  document.getElementById('copy-msg-alert').style.visibility = 'hidden';
  document.getElementById('newRoomID').innerText = roomId;
  document.getElementById('new-room-id-cntr').style.visibility = 'visible';
}

// Copy room ID
function copyNewRoomID() {
  var newRoomID = document.getElementById('newRoomID');
  var range = document.createRange();
  range.selectNode(newRoomID);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);
  document.execCommand('copy');
  window.getSelection().removeAllRanges(); 

  document.getElementById('new-room-id-cntr').style.visibility = 'hidden';
  document.getElementById('copy-msg-alert').style.visibility = 'visible';

  setTimeout(() => {
    document.getElementById('copy-msg-alert').style.visibility = 'hidden';
  }, 1500);
}

// Join room
function joinRoom(){
  var username = document.getElementById('username').value;
  var roomid = document.getElementById('roomid').value;

  localStorage.setItem('username', username);
  localStorage.setItem('roomID', roomid);

  window.location.href = './codespace.html'; 
}

// Initializing codemirror
var codeInput = CodeMirror(document.getElementById("code-input"), {
  value: `// JavaScript code goes here\n\nconsole.log("Hello, World!");`,
  mode: "javascript", // Set the default mode here
  theme: "dracula",
  indentUnit: 4,
  tabSize: 4,
  lineWrapping: true,
  lineNumbers: true,
  autoCloseBrackets: true,
  matchBrackets: true
}); 


// Creating and syncing flowchart based on the code across all connected screens
(function () {
  const worker = new Worker('worker.js'), 
  svgImage = document.getElementById('svgImage'), 
  downloadFile = document.getElementById('downloadFile'), 
  c = codeInput;

  // Function to update the code input element
  const updateCodeInput = (newCode) => {
    // Avoid updating the code input if it's already the same
    if (c.getValue() !== newCode) {
        c.setValue(newCode);
    }
  };

  // Rendering and emitting the updated code and flowchart to all connected players
  c.on('change', _.debounce(() => {
    const newCode = c.getValue();
    io.emit("codeChange", newCode);
    worker.postMessage({ code: newCode });
  }), 500);

  // Render flowchart based on input code
  worker.onmessage = function (message) {
    var svg = message.data.svg;
    svgImage.innerHTML = svg;
  };

  // Download flowchart
  downloadFile.addEventListener('click', () => {
    const fileName = `flowchart_${(new Date().toString()).replace(/ /g, '_')}.svg`, file = new File([svgImage.innerHTML], fileName, { type: 'image/svg+xml;charset=utf-8' });
    window.saveAs(file, fileName);
  });

  // Sending initial input code value to render the flowchart
  worker.postMessage({ code: c.getValue() });

  // Recieving the updated flowchart and code on all connected player screen
  io.on("codeChange", (newCode) => {
    worker.postMessage({ code: newCode });
    updateCodeInput(newCode); // Update the code input
  })

})();

// Adding new player to the session
var logoColor = ["#edca05", "#38b520", "#4e61f3", "#b322f7", "#f722be", "#01b982"];
var savedUsername = localStorage.getItem('username');
JoinUser(savedUsername);

// Show joined ninjas/players
function JoinUser(username){

  showUserProfile(username, 'ninja');
  console.log(username + " " + "has joined!");
  io.emit('joinuser', username);
}

// Show added player/ninja logo 
function showUserProfile(username,type){
  var ninjas = document.getElementById('ninjas');

  let mainDiv = document.createElement('div');
  let classname = type;
  mainDiv.classList.add(classname, 'ninja');

  // Select a color randomly from the colors array
  let color = logoColor[Math.floor(Math.random() * logoColor.length)];
  mainDiv.style.backgroundColor = color;

  let uname = username;
  let displayname = uname[0].toUpperCase();

  let markup = `
    <p>${displayname}</p>
  `
  mainDiv.innerHTML = markup;
  ninjas.appendChild(mainDiv);
}

// Generating code output using compiler api and syncing output across all connected players screen
async function runCode() {
    var code_input = codeInput.getValue();
    var outputDisplay = document.getElementById('stdout-output');

    const url = 'https://online-code-compiler.p.rapidapi.com/v1/';
    const options = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-RapidAPI-Key': '567a8f2909msh81cbeba617c7b55p10c743jsne03adc36cd6b',
      'X-RapidAPI-Host': 'online-code-compiler.p.rapidapi.com'
    },
    body: JSON.stringify({
      language: "nodejs",
      version: 'latest',
      code: code_input,
      input: null
    })
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    var o = result.output;
    console.log(o);
    outputDisplay.innerHTML = o;
    io.emit("output", o);
  } catch (error) {
    console.error(error);
  }
}

// Recieving output on all connected player screen
io.on('output', (o) => {
  runCode();
});

// Adding the new joined player/ninja on every screen 
io.on('joinuser', (username) => {
  showUserProfile(username);
})