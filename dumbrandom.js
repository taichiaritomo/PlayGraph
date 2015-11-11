var buttonTexts = [
  "great, what does that mean.",
  "what.",
  "cool, let me try."
  ];

var randomIndex = Math.floor(Math.random()*buttonTexts.length);

document.querySelector("#login-button").textContent = buttonTexts[randomIndex];