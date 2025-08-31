// =================================================================================================
// ==== Classes ====================================================================================
// =================================================================================================

class Utils {
  static getDist(vec1: {x: number, y: number}, vec2: {x: number, y: number}): number {
    return Math.sqrt((vec1.x - vec2.x)**2 + (vec1.y - vec2.y)**2);
  }

  static getRandFloat(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  // Random integer from min to max inclusive
  static getRandInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static bound(value: number, bound1: number, bound2: number): number {
    const max = Math.max(bound1, bound2);
    const min = Math.min(bound1, bound2);
    return Math.max(Math.min(value, max), min);
  }

}

class Vector {
  x: number;
  y: number;

  constructor(x?: number, y?: number) {
    this.x = x ?? 1;
    this.y = y ?? 1;
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
  
  // !!! Ignores zero vectors
  getNormalized(): Vector {
    const mag = this.getMagnitude();
  
    // Return <0,0> if input is zero vector
    if (mag === 0) {
      return new Vector(0, 0);
    }
  
    return new Vector(this.x / mag, this.y / mag);
  }

  // !!! Ignores zero vectors
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
  // (basis vector does not need to be unit length)
  getProjection(basis: Vector): Vector {
    if (basis.getMagnitude() === 0) {
      console.error("Cannot project onto a zero basis vector")
    }
    const newMag = this.getDotProduct(basis) / basis.getMagnitude()**2
    
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

  constructor(pos: Vector, mass?: number, radius?: number, vel?: Vector, color?: string) {
    this.pos = pos;
    this.vel = vel ?? new Vector(0, 0);
    this.mass = mass ?? 1;

    this.radius = radius ?? 20;
    this.color = color ?? "black";
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
    wallImpulseTracker.addEntry(createTimedValue<number>(frameNum, impulse.getMagnitude()))

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
    if (Utils.getDist(this.pos, other.pos) >= this.radius + other.radius) {
      return
    }

    // If balls have exact same pos, offset a bit to avoid division by zero
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

// !!! WORK IN PROGRESS
// TODO BUG: has some problems with tail segments moving
// (following the ball, when a new segment should have been created)
class TracerBall extends Ball {
  tracerTail: Vector[] = [];
  maxTailLength: number;

  constructor(pos: Vector, mass?: number , radius?: number, vel?: Vector, color?: string, maxTailLength?: number) {
    super(pos, mass, radius, vel, color);
    this.maxTailLength = maxTailLength ?? 200;
  }

  draw(ctx: any): void {
    super.draw(ctx);

    // Draw tail
    if (this.tracerTail.length !== 0) {
      const startPos = this.tracerTail[0];
      ctx.beginPath();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.moveTo(startPos.x, startPos.y);

      for (const pos of this.tracerTail) {
        ctx.lineTo(pos.x, pos.y);
      }

      ctx.stroke();

    }
  }

  updatePosition(): void {
    super.updatePosition();
    console.log('e')

    this.tracerTail.push(this.pos);
    if (this.tracerTail.length > this.maxTailLength) {
      this.tracerTail.shift();
          console.log('x')
    }
  }
}

class ParticleFluid {
  particleList: Ball[];
  color: string;
  mass: number;
  radius: number;

  constructor(particleList?: Ball[], color?: string, mass?: number, radius?: number) {
    this.particleList = particleList ?? [];
    this.color = color ?? "black";
    this.mass = mass ?? 1;
    this.radius = radius ?? 7;
  }

  createParticle(vel?: Vector, pos?: Vector, color?: string, mass?: number, radius?: number): void {
    radius = radius ?? this.radius;
    pos = pos ?? new Vector(Utils.getRandInt(radius, canvas.width - radius), Utils.getRandInt(radius, canvas.height - radius));
    vel = vel ?? new Vector(0, 0);
    color = color ?? this.color;
    mass = mass ?? this.mass;

    const particle = new Ball(pos, mass, radius, vel, color);

    this.particleList.push(particle);
  }

  createKEParticle(KE: number, pos?: Vector, direction?: Vector, color?: string, mass?: number, radius?: number): void {
    mass = mass ?? this.mass;

    // KE = 0.5 * m * (v**2)
    // v = sqrt(2 * KE / m)
    const speed = Math.sqrt(2 * KE / mass)
    let vel: Vector;
    if (direction === undefined) {
      const angle = Utils.getRandFloat(0, 2*Math.PI);
      vel = (new Vector(speed, 0)).getRotated(angle);
    }
    else {
      vel = direction.getNormalized().getScaled(speed);
    }

    this.createParticle(vel, pos, color, mass, radius);

  }

  getParticleCount(): number {
    return this.particleList.length
  }

  getAvgMomentum(particleList: Ball[] = this.particleList): Vector {
    const totalMomentum = new Vector(0, 0);

    if (particleList.length === 0) {
      return totalMomentum;
    }

    for (const particle of particleList) {
      totalMomentum.add(particle.vel.getScaled(particle.mass))
    }

    return totalMomentum.getScaled(1/particleList.length)
  }

  getAvgKE(particleList: Ball[] = this.particleList): number {
    if (particleList.length === 0) {
      return 0;
    } 

    let totalKE = 0;
    for (const particle of particleList) {
      totalKE += 0.5 * particle.mass * (particle.vel.getMagnitude()**2);
    }

    return totalKE / particleList.length
  }

  getAvgSpeed(particleList: Ball[] = this.particleList): number {
    if (particleList.length === 0) {
      return 0;
    } 

    let totalSpeed = 0;
    for (const particle of particleList) {
      totalSpeed += particle.vel.getMagnitude();
    }

    return totalSpeed / particleList.length
  }

  // !!! Work in progress, for now is equivalent to getAvgKE
  getTemperature(particleList?: Ball[], R_constant: number = 1): number {
    particleList = particleList ?? this.particleList;

    if (particleList.length === 0) {
      return 0;
    }

    // KE_total = (3/2)nRT
    // -> T = (2*KE_total)/(3*nR)
    // -> T = (2/3)*KE_avg*(1/R)

    const avgKE = this.getAvgKE(particleList);
    const temperature = (1) * avgKE / R_constant

    return temperature
  }

  // Adds/removes particles until count is met
  setParticleCount(count: number, newParticleKE: number): void {
    if (count < 0) {
      return;
    }

    // Add if under, remove if over, left with wanted count
    while (this.getParticleCount() < count) {
      this.createKEParticle(newParticleKE);
    }
    while (this.getParticleCount() > count) {
      this.particleList.pop();
    }

    // Side note: Thanks Shun Akiyama, what a cool way to get the right count!
  }

}

// A value tied to a timestamp
type TimedValue<T> = {
  timestamp: number,
  value: T
}

// A stack of timed values
// !!! Timed values must be added in chronological order
class TimedStack<T> {
  maxCount: number;

  entryList: TimedValue<T>[] = [];

  constructor(maxCount?: number) {
    this.maxCount = maxCount ?? 10000;
  }

  getTimeWindow(): number {
    if (this.entryList.length < 2) {
      return 0
    }

    return (this.entryList[this.entryList.length-1].timestamp - this.entryList[0].timestamp)
  }

  addEntry(entry: TimedValue<T>): void {
    // Error if entry is not in chronological order
    if (this.entryList.length !== 0 && entry.timestamp < this.entryList[this.entryList.length-1].timestamp) {
      console.error("Entry is not in chronological order")
      return
    }

    this.entryList.push(entry);

    if (this.entryList.length > this.maxCount) {
      this.entryList.shift()
    }
  }

  purgeOldEntries(oldestAcceptedTimestamp: number): void {

    // Find oldest allowed entry
    for (let i = 0; i < this.entryList.length; i ++) {
      if (this.entryList[i].timestamp >= oldestAcceptedTimestamp) {

        // Remove all previous entries
        this.entryList.splice(0, i);
        return;
      }
    }

    // All entries are too old
    this.entryList.splice(0)
  }

  getNewEntries(oldestAcceptedTimestamp: number): TimedValue<T>[] {

    // Find oldest wanted entry
    for (let i = 0; i < this.entryList.length; i ++) {
      if (this.entryList[i].timestamp >= oldestAcceptedTimestamp) {

        // Return this and all later entries
        return this.entryList.slice(i);
      }
    }

    // No entries are new enough
    return [];
  }
}


type dimensions = {
  height: number,
  width: number
} 

// =================================================================================================
// ==== Main Code ==================================================================================
// =================================================================================================

const canvas: any = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");


// Inputs
const canvasResizer: any = document.getElementById("canvas-resizer");

const canvasResizeForm: any = document.getElementById("canvas-resize-form");
const heightInput: any = document.getElementById("height-input");
const widthInput: any = document.getElementById("width-input");

const particleCountForm: any = document.getElementById("particle-count-form");
const particleCountInput: any = document.getElementById("particle-count-input");
const particleCountSlider: any = document.getElementById("particle-count-slider");

// Readings
const volumeReading = document.getElementById("volume-reading");
const particleCountReading = document.getElementById("particle-count-reading");
const temperatureReading = document.getElementById("temperature-reading");
const pressureReading = document.getElementById("pressure-reading");
const avgKEReading = document.getElementById("avg-ke-reading");

// Consts
const CANVAS_RECT = canvas.getBoundingClientRect();
const FPS = 20;

let canvasSize: dimensions;
updateCanvasSize()

// ==== Global Vars ==================================

let isPaused = false;

let allowCollisions = true;
let initalBallCount = 1000
let initialBallKE = 100
let ballRadius = 7

// ==== Tracking Vars ==================================

let frameNum = 0;
const wallImpulseTracker = new TimedStack<number>();


// ==== Initial Setup ==================================

const defaultGas = new ParticleFluid(undefined, undefined, undefined, ballRadius);


for (let i = 0; i < initalBallCount; i ++) {
  defaultGas.createKEParticle(initialBallKE)
}

updateParticleCount()

// Set frame rate
setInterval(updateFrame, 1000 / FPS);


// =================================================================================================
// ==== Functions ==================================================================================
// =================================================================================================


// ==== UTILITY FUNCTIONS ==================================

function createTimedValue<T>(timestamp: number, value: T): TimedValue<T> {
  return {timestamp: timestamp, value: value};
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

function updateCanvasSize(prevSize?: dimensions): void {
  if (prevSize === undefined || prevSize.height !== canvas.clientHeight || prevSize.width !== canvas.clientWidth) {
    resizeCanvas({height: canvas.clientHeight, width: canvas.clientWidth});
  }
}

function updateParticleCount(): void {
  particleCountInput.placeholder = defaultGas.getParticleCount();
  particleCountInput.value = "";

  particleCountSlider.value = defaultGas.getParticleCount();

}


// ==== TRACKING FUNCTIONS ==================================


function updateHistogram(balls: Ball[] = defaultGas.particleList): void {

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
  Plotly.newPlot('histogram1', data, layout, { displayModeBar: false });
}


// ==== DRAW FUNCTIONS ==================================


function drawFrame(): void {
  updateCanvasSize(canvasSize);

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw balls
  for (const ball of defaultGas.particleList) {
    ball.draw(ctx);
  }

}

function updateUI(): void {
  updateHistogram(defaultGas.particleList);

  const avgingWindow = Utils.bound(wallImpulseTracker.getTimeWindow(), 1, 20);

  const volume = canvas.width*canvas.height;
  const area = 2*(canvas.width + canvas.height);

  // Averages the values of every timed number within the averaging window
  const impulseList = wallImpulseTracker.getNewEntries(frameNum - avgingWindow);
  const impulsePerFrame = impulseList.reduce((acc, timedValue) => (acc + timedValue.value), 0) / avgingWindow;

  const pressure = impulsePerFrame / area;

  // Update readings
  volumeReading!.innerText = volume.toString();
  particleCountReading!.innerText = defaultGas.getParticleCount().toString();
  temperatureReading!.innerText = defaultGas.getTemperature().toFixed(2).toString();
  avgKEReading!.innerText = defaultGas.getAvgKE().toFixed(2).toString();
  pressureReading!.innerText = pressure.toFixed(5).toString();
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
  for (const ball of defaultGas.particleList) {
    // ball.applyGravity();
    ball.updatePosition();
    ball.applyWallCollision();
  }

  // Loops through every pair of balls without duplicates
  for (let i = 0; i < defaultGas.particleList.length; i ++) {
    for (let j = i + 1; j < defaultGas.particleList.length; j ++) {
      const ball1 = defaultGas.particleList[i];
      const ball2 = defaultGas.particleList[j];

      if (allowCollisions) {
        ball1.attemptBallCollision(ball2);
      }
    }
  }
}


// =================================================================================================
// ==== EVENT HANDLERS =============================================================================
// =================================================================================================

const pauseButton: any = document.getElementById("pause-button");

pauseButton.addEventListener("click", function(event) {
  if (isPaused) {
    isPaused = false
    pauseButton.innerText = "Pause"
  }
  else {
    isPaused = true
    pauseButton.innerText = "Unpause"
  }
})


canvas.addEventListener("mousedown", function (event) {
  const mousePos = getCursorPosition(event);

  // defaultGas.createParticle(new Vector(0, 0), mousePos, "red", undefined, 15)
  defaultGas.particleList.push(new TracerBall(mousePos, undefined, 15, undefined, "red"))
});

document.addEventListener("keydown", function (event) {
  if (event.key === " ") {
    allowCollisions = !allowCollisions
  }
});

canvasResizeForm.addEventListener("submit", function (event) {
  event.preventDefault();

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

particleCountForm.addEventListener("submit", function (event) {
  event.preventDefault();

  let submittedParticleCount: string = particleCountInput.value;

  if (submittedParticleCount === "") {
    return;
  }

  defaultGas.setParticleCount(parseInt(submittedParticleCount), initialBallKE);

  updateParticleCount()
})

particleCountSlider.addEventListener("input", function(event) {
  defaultGas.setParticleCount(this.value, initialBallKE);

  updateParticleCount()
})
