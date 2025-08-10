// ==================================================================================================
// ==== Classes =====================================================================================
// ==================================================================================================

class Vector {
  x: number;
  y: number;

  constructor(x: number = 1, y: number = 1) {
    this.x = x;
    this.y = y;
  }
  
  getCopy(): Vector {
    return new Vector(this.x, this.y);
  }

  getScaled(scaler: number): Vector {
    return new Vector(scaler * this.x, scaler * this.y)
  }

  scale(scaler: number): void {
    this.x *= scaler;
    this.y *= scaler;
  }

  getNeg(): Vector {
    return this.getScaled(-1);
  }
  
  getMagnitude(): number {
    return Math.sqrt(this.x**2 + this.y**2);
  }

  getAddition(other: Vector): Vector {
    return new Vector(this.x + other.x, this.y + other.y);
  }

  add(other: Vector): void {
    this.x += other.x;
    this.y += other.y;
  }
  
  // self.diff(other) = other - self
  // self + self.diff(other) = other
  getDifference(other: Vector): Vector {
    return new Vector(other.x - this.x, other.y - this.y);
  }
  
  getNormalized(): Vector {
    const mag = this.getMagnitude();
  
    // Return <0,0> if input is zero vector
    if (mag === 0) {
      return new Vector(0, 0);
    }
  
    return new Vector(this.x / mag, this.y / mag);
  }

  normalize(): void {
    const mag = this.getMagnitude();

    // Do nothing if zero vector
    if (mag === 0) {
      return
    }

    this.x = this.x / mag;
    this.y = this.y / mag;
  }

  getDotProduct(other: Vector): number {
    return this.x * other.x + this.y * other.y
  }
  
  // Returns current vector projected onto a basis vector
  // (function automatically normalizes basis vector)
  getProjection(basis: Vector): Vector {
    const newMag = this.getDotProduct(basis)// / basis.getMagnitude()**2
    
    return basis.getScaled(newMag)
  }

  // Input: angle in radians
  getRotated(theta: number): Vector {
    const x = this.x * Math.cos(theta) - this.y * Math.sin(theta);
    const y = this.x * Math.sin(theta) + this.y * Math.cos(theta);

    return new Vector(x, y);
  }
}

class Ball {
  pos: Vector;
  vel: Vector;
  mass: number;

  radius: number;
  color: string;

  constructor(pos: Vector, mass: number = 1, radius: number = 20, vel: Vector = new Vector(0, 0)) {
    this.pos = pos;
    this.vel = vel;
    this.mass = mass;

    this.radius = radius;
    this.color = "black";
  }

  draw(ctx: any): void {
    ctx.fillStyle = this.color;

    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI);
    ctx.fill();
  }

  updatePosition(): void {
    this.pos.add(this.vel);
  }

  applyGravity(gravConst: number = 1): void {
    this.vel.y += gravConst;
  }

  // Collides the ball elastically with a surface of infinite mass
  // Assumes the ball is already in perfect contact with the surface (ignores position)
  surfaceCollide(surfaceNormal: Vector): void {
    const unitNormal = surfaceNormal.getNormalized(); // Unit normal vector of the surface
    const unitTangent = unitNormal.getRotated(0.5*Math.PI); // Unit tangent vector of the surface

    const normalVel_i = this.vel.getProjection(unitNormal); // Normal component of initial ball velocity
    const tangentVel_i = this.vel.getProjection(unitTangent); // Tangent component of initial ball velocity

    const normalVel_f = normalVel_i.getNeg(); // Normal component of final ball velocity
    const tangentVel_f = tangentVel_i.getCopy(); // Tangent component of final ball velocity

    const velocity_f = normalVel_f.getAddition(tangentVel_f); // Final ball velocity

    // Wall impulse tracking
    const impulse = this.vel.getDifference(velocity_f).getScaled(this.mass)
    trackNewWallImpulse(impulse.getMagnitude())


    this.vel = velocity_f;
  }

  applyWallCollision(xMin: number = 0, yMin: number = 0, xMax: number = canvas.width, yMax: number = canvas.height): void {
    if (this.pos.x - this.radius < xMin) {
      this.pos.x = xMin + this.radius;
      this.surfaceCollide(new Vector(1, 0))
    }
    if (this.pos.x + this.radius > xMax) {
      this.pos.x = xMax - this.radius;
      this.surfaceCollide(new Vector(-1, 0))
    }
    if (this.pos.y - this.radius < yMin) {
      this.pos.y = yMin + this.radius;
      this.surfaceCollide(new Vector(0, 1))
    }
    if (this.pos.y + this.radius > yMax) {
      this.pos.y = yMax - this.radius;
      this.surfaceCollide(new Vector(0, -1))
    }
  }

  // Collides this ball with another ball, updates the vel of both
  // Ignores ball intersection/clipping issues!!!
  ballCollide(other: Ball): void {
    const unitNormal = other.pos.getDifference(this.pos).getNormalized(); // Unit normal vector of the contact point surface
    const unitTangent = unitNormal.getRotated(0.5*Math.PI); // Unit tangent vector of the contact point surface
    const m1 = this.mass;
    const m2 = other.mass;

    const normalMag_1_i = this.vel.getDotProduct(unitNormal); // Magnitude of the normal comp of this ball's initial vel
    const normalMag_2_i = other.vel.getDotProduct(unitNormal); // Magnitude of the normal comp of other ball's initial vel

    // Final tangent vel === initial tangent vel
    const tangentVel_1_f = this.vel.getProjection(unitTangent); // Tangent component of this ball's final vel
    const tangentVel_2_f = other.vel.getProjection(unitTangent); // Tangent component of other ball's final vel

    // Magnitude of the final normal velocities
    // Uses 1D elastic collision formulas along normal
    const normalMag_1_f = (((m1 - m2) * normalMag_1_i) + (2 * m2 * normalMag_2_i)) / (m1 + m2);
    const normalMag_2_f = (((m2 - m1) * normalMag_2_i) + (2 * m1 * normalMag_1_i)) / (m1 + m2);

    // Final velocity vectors of the two balls
    const vel_1_f = unitNormal.getScaled(normalMag_1_f).getAddition(tangentVel_1_f);
    const vel_2_f = unitNormal.getScaled(normalMag_2_f).getAddition(tangentVel_2_f);

    this.vel = vel_1_f;
    other.vel = vel_2_f;

    // Update positions to avoid clipping

    const surfacePos_1 = this.pos.getAddition(unitNormal.getScaled(-this.radius)); // Point on ball1 with closest dist to ball2
    const surfacePos_2 = other.pos.getAddition(unitNormal.getScaled(this.radius)); // Point on ball2 with closest dist to ball1
    const avgContactPos = surfacePos_1.getAddition(surfacePos_2).getScaled(0.5); // Average position of ball overlap

    this.pos = avgContactPos.getAddition(unitNormal.getScaled(this.radius))
    other.pos = avgContactPos.getAddition(unitNormal.getScaled(-other.radius))
  }

  // Collides balls if within reach and moving in correct direction
  attemptBallCollision(other: Ball): void {
    // Ignore if balls are not touching
    if (getDist(this.pos, other.pos) >= this.radius + other.radius) {
      return
    }

    // If balls have exact same pos, offset a bit
    if (this.pos.x === other.pos.x && this.pos.y === other.pos.y) {
      this.pos.x += 0.00001
    }
    
    // Ignore if balls are moving away from each other
    const unitNormal = other.pos.getDifference(this.pos).getNormalized(); // Unit normal vector of the contact point
    const velRel = other.vel.getDifference(this.vel).getDotProduct(unitNormal); // Relative velocity along the normal
    if (velRel > 0) {
      return
    }

    this.ballCollide(other);
  }


}

// class ParticleFluid {
//   particleList: Ball[];
//   color: string;

//   constructor(particleList: Ball[] = [], color: string = "black") {
//     this.particleList = particleList;
//     this.color = color;
//   }




// }

type dimensions = {
  height: number,
  width: number
} 

// ==================================================================================================
// ==== Main Code ===================================================================================
// ==================================================================================================

const canvas: any = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

const canvasResizer: any = document.getElementById("canvas-resizer");

const volumeReading = document.getElementById("volume-reading");
const amountReading = document.getElementById("amount-reading");
const temperatureReading = document.getElementById("temperature-reading");

const canvasResizeForm: any = document.getElementById("canvas-resize-form");
const heightInput: any = document.getElementById("height-input");
const widthInput: any = document.getElementById("width-input");

const CANVAS_RECT = canvas.getBoundingClientRect();
const FPS = 20;

let canvasSize: dimensions;

updateCanvasSize()

// ==== Global Vars ==================================

let isPaused = false;

let allowCollisions = true;
let initalBallAmount = 1000
let initialBallSpeed = 15
let ballRadius = 7

// ==== Tracking Vars ==================================

let frameNum = 0;

let totalWallImpulse = 0;

const trackingTime = 500


// ==== Initial Setup ==================================

const ballList: Ball[] = [];


for (let i = 0; i < initalBallAmount; i ++) {
  const newBall = createRandBall(initialBallSpeed, ballRadius);
  // if (newBall.pos.x > 500) {
  //   newBall.color = "red";
  //   newBall.mass = 50
  // }
 
  ballList.push(newBall)
}


// Set frame rate
setInterval(updateFrame, 1000 / FPS);


// ==================================================================================================
// ==== Functions ===================================================================================
// ==================================================================================================


// ==== UTILITY FUNCTIONS ==================================


function getDist(vec1: Vector, vec2: Vector): number {
  return Math.sqrt((vec1.x - vec2.x)**2 + (vec1.y - vec2.y)**2)
}

function getRandFloat(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

// Random integer from min to max inclusive
function getRandInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function bound(value: number, min: number, max: number): number {
  return Math.max(Math.min(value, max), min)
}

function createRandBall(speed: number = 10, radius: number = 20, mass: number = 1): Ball {
  const angle = getRandFloat(0, 2*Math.PI);
  const vel = new Vector(speed, 0);
  const pos = new Vector(getRandInt(radius, canvas.width - radius), getRandInt(radius, canvas.height - radius))

  return new Ball(pos, mass, radius, vel.getRotated(angle))
}

function getCursorPosition(event: any): Vector {
  const x = event.clientX - CANVAS_RECT.left;
  const y = event.clientY - CANVAS_RECT.top;
  return new Vector(x, y);
}



function resizeCanvas(newSize: dimensions): void {
  const snapSize = 1;
  const minSize = 1;

  const newHeight = Math.max(minSize, Math.floor(newSize.height / snapSize) * snapSize);
  const newWidth = Math.max(minSize, Math.floor(newSize.width / snapSize) * snapSize);

  // Resize canvas and canvasResizer
  canvas.height = newHeight;
  canvas.width = newWidth;
  canvasResizer.style.height = `${newHeight}px`;
  canvasResizer.style.width = `${newWidth}px`;
  
  // Update resizing input placeholder values
  heightInput.placeholder = newHeight;
  widthInput.placeholder = newWidth;
  heightInput.value = "";
  widthInput.value = "";

  canvasSize = {height: newHeight, width: newWidth}

  console.log("Container Resized!")
}

function updateCanvasSize(prevSize: dimensions | null = null): void {

  if (prevSize === null || prevSize.height !== canvas.clientHeight || prevSize.width !== canvas.clientWidth) {
    resizeCanvas({height: canvas.clientHeight, width: canvas.clientWidth});

    isPaused = true;
  }

  else {
    isPaused = false;
  }

}


// ==== TRACKING FUNCTIONS ==================================


function getAvgMomentum(balls: Ball[] = ballList): Vector {
  const totalMomentum = new Vector(0, 0);

  if (balls.length === 0) {
    return totalMomentum;
  }

  for (const ball of balls) {
    totalMomentum.add(ball.vel.getScaled(ball.mass))
  }

  return totalMomentum.getScaled(1/balls.length)
}

function getAvgKE(balls: Ball[] = ballList): number {
  if (balls.length === 0) {
    return 0;
  } 

  let totalKE = 0;
  for (const ball of balls) {
    totalKE += 0.5 * ball.mass * (ball.vel.getMagnitude()**2);
  }

  return totalKE / balls.length
}

function getAvgSpeed(balls: Ball[] = ballList): number {
  if (balls.length === 0) {
    return 0;
  } 

  let totalSpeed = 0;
  for (const ball of balls) {
    totalSpeed += ball.vel.getMagnitude();
  }

  return totalSpeed / balls.length
}

function getAvgSpeedDev(balls: Ball[] = ballList): number {
  if (balls.length === 0) {
    return 0;
  }

  const avgSpeed = getAvgSpeed(balls);

  let totalDev = 0;
  for (const ball of balls) {
    totalDev += (avgSpeed - ball.vel.getMagnitude())**2
  }

  return totalDev / balls.length;
}

function getTemperature(balls: Ball[] = ballList, R_constant: number = 1): number {
  if (balls.length === 0) {
    return 0;
  }

  // KE_total = (3/2)nRT
  // -> T = (2*KE_total)/(3*nR)
  // -> T = (2/3)*KE_avg*(1/R)

  const avgKE = getAvgKE(balls);
  const temperature = (1) * avgKE / R_constant

  return temperature
}

function updateHistogram(balls: Ball[] = ballList): void {

  const ballSpeeds: number[] = [];
  for (const ball of balls) {
    ballSpeeds.push(ball.vel.getMagnitude());
  }

  const trace = {
    x: ballSpeeds,
    type: 'histogram',
    histnorm: "percent",
    xbins: {
      start: 0,
      end: 100,
      size: 2
    },
    marker: {
      color: 'skyblue',
    }
  };

  const layout = {
    title: { text: "Speed Distribution" },
    xaxis: {
      title: { text: "Speed" },
      range: [0, 80] // [0, 80]
    },
    yaxis: {
      title: { text: "Percent %" },
      range: [0, 20]
    },
    bargap: 0.05
  };

  const data = [trace];
  
  // @ts-ignore
  Plotly.newPlot('histogram1', data, layout);
}

function trackNewWallImpulse(impulse: number): void {
  totalWallImpulse += impulse
}

// ==== OTHER FUNCTIONS ==================================

function drawVector(ctx: any, posX: number, posY: number, magX: number, magY: number): void {
  let toX = posX + magX;
  let toY = posY + magY;

  ctx.beginPath();
  ctx.arc(posX, posY, 2, 0, 2 * Math.PI);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(posX, posY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
}

// ==== DRAW FUNCTIONS ==================================


function drawFrame(): void {
  updateCanvasSize(canvasSize);

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw balls
  for (const ball of ballList) {
    ball.draw(ctx);
  }

}

function updateUI(): void {
  updateHistogram(ballList);

  const volume = canvas.width*canvas.height

  volumeReading!.innerText = volume.toString();
  amountReading!.innerText = ballList.length.toString();
  temperatureReading!.innerHTML = getTemperature(ballList).toFixed(2).toString();
}

function updateFrame(): void {
  updateUI();
  drawFrame();
  
  // Ignore if paused
  if (isPaused) {
    return
  }

  // Tracking
  frameNum += 1

  // Update balls position
  for (const ball of ballList) {
    // ball.applyGravity();
    ball.updatePosition();
    ball.applyWallCollision();
  }

  // Loops through every pair of balls without duplicates
  for (let i = 0; i < ballList.length; i ++) {
    for (let j = i + 1; j < ballList.length; j ++) {
      const ball1 = ballList[i];
      const ball2 = ballList[j];

      if (allowCollisions) {
        ball1.attemptBallCollision(ball2);
      }
    }
  }
}


// ==================================================================================================
// ==== EVENT HANDLERS ==============================================================================
// ==================================================================================================


canvas.addEventListener("mousedown", function (e) {
  const mousePos = getCursorPosition(e);

  const ball = new Ball(mousePos);
  
  ballList.push(ball);

});

document.addEventListener("keydown", function (e) {
  if (e.key === " ") {
    allowCollisions = !allowCollisions
  }
});

canvasResizeForm.addEventListener("submit", function (e) {
  e.preventDefault();

  let submittedHeight = heightInput.value;
  let submittedWidth = widthInput.value;

  if (submittedHeight === "") {
    submittedHeight = canvasSize.height;
  }
  if (submittedWidth === "") {
    submittedWidth = canvasSize.width;
  }

  const newSize = {height: parseInt(submittedHeight), width: parseInt(submittedWidth)}

  resizeCanvas(newSize)
  
});
