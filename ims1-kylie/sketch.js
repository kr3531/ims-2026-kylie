//Source Code from Google Gemini


let socket;
let otherPlayers = [];
let forceFields = [];
let stars = [];
let myTrail = []; // This will store your path

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: random(width), y: random(height),
      size: random(0.5, 2), offset: random(TWO_PI)
    });
  }

  socket = new WebSocket('ws://localhost:3000');
  socket.onmessage = (event) => {
    let data = JSON.parse(event.data);
    if (data.type === 'sync') {
      otherPlayers = data.players;
      if (data.forceFields) forceFields = data.forceFields;
    }
  };
}

function draw() {
  // 1. SOLID BACKGROUND (Guarantees no stains)
  background(5, 5, 15); 

  // 2. Stars
  noStroke();
  for (let s of stars) {
    let alpha = map(sin(frameCount * 0.03 + s.offset), -1, 1, 40, 200);
    fill(255, alpha);
    ellipse(s.x, s.y, s.size);
  }

  // Color logic
  colorMode(HSB, 360, 100, 100);
  let currentHue = (frameCount * 0.7) % 360;
  let myDynamicColor = color(currentHue, 80, 100);

  // 3. STORE AND DRAW TRAIL
  // Save current position
  myTrail.push({ x: mouseX, y: mouseY, hue: currentHue });
  
  // Keep only the last 30 frames of movement (Adjust this for longer/shorter trails)
  if (myTrail.length > 30) {
    myTrail.shift(); 
  }

  // Draw the ribbon
  noFill();
  strokeWeight(12);
  drawingContext.shadowBlur = 20;

  for (let i = 1; i < myTrail.length; i++) {
    let p1 = myTrail[i - 1];
    let p2 = myTrail[i];
    
    // Fade the trail line by line
    let alpha = map(i, 0, myTrail.length, 0, 1);
    let col = color(p2.hue, 80, 100, alpha); 
    
    stroke(col);
    drawingContext.shadowColor = col;
    line(p1.x, p1.y, p2.x, p2.y);
  }

  // 4. Players & Orbs
  noStroke();
  for (let force of forceFields) {
    drawingContext.shadowColor = force.color;
    fill(force.color);
    ellipse(force.position.x, force.position.y, 25 + sin(frameCount * 0.1) * 8);
  }

  for (let p of otherPlayers) {
    if (p.position) {
      drawingContext.shadowColor = p.color;
      fill(p.color);
      ellipse(p.position.x, p.position.y, 10);
    }
  }

  drawingContext.shadowBlur = 0;
  colorMode(RGB);

  // Server Sync
  if (socket && socket.readyState === WebSocket.OPEN && frameCount % 3 === 0) {
    let hexColor = "#" + hex(red(myDynamicColor), 2) + hex(green(myDynamicColor), 2) + hex(blue(myDynamicColor), 2);
    socket.send(JSON.stringify({
      type: 'cursor', position: { x: mouseX, y: mouseY, z: 0 }, color: hexColor
    }));
  }
}

function mousePressed() {
  if (socket && socket.readyState === WebSocket.OPEN) {
    colorMode(HSB, 360, 100, 100);
    let col = color((frameCount * 0.7) % 360, 80, 100);
    let hexColor = "#" + hex(red(col), 2) + hex(green(col), 2) + hex(blue(col), 2);
    socket.send(JSON.stringify({
      type: 'add_force', position: { x: mouseX, y: mouseY, z: 0 }, color: hexColor
    }));
    colorMode(RGB);
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }