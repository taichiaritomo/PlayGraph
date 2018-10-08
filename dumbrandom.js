var buttonTexts = [
  "what does it mean.",
  "cool, let me try.",
  "i like space.",
  "i can dig that.",
  "i have playlists."
  ];

var randomIndex = Math.floor(Math.random()*buttonTexts.length);

document.querySelector("#login-button").textContent = buttonTexts[randomIndex];