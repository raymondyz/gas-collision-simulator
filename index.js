// =================================================================================================
// ==== Classes ====================================================================================
// =================================================================================================
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Utils = /** @class */ (function () {
    function Utils() {
    }
    Utils.getDist = function (vec1, vec2) {
        return Math.sqrt(Math.pow((vec1.x - vec2.x), 2) + Math.pow((vec1.y - vec2.y), 2));
    };
    Utils.getRandFloat = function (min, max) {
        return Math.random() * (max - min) + min;
    };
    // Random integer from min to max inclusive
    Utils.getRandInt = function (min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    Utils.bound = function (value, bound1, bound2) {
        var max = Math.max(bound1, bound2);
        var min = Math.min(bound1, bound2);
        return Math.max(Math.min(value, max), min);
    };
    return Utils;
}());
var Vector = /** @class */ (function () {
    function Vector(x, y) {
        this.x = x !== null && x !== void 0 ? x : 1;
        this.y = y !== null && y !== void 0 ? y : 1;
    }
    Vector.prototype.getCopy = function () {
        return new Vector(this.x, this.y);
    };
    Vector.prototype.getScaled = function (scaler) {
        return new Vector(scaler * this.x, scaler * this.y);
    };
    Vector.prototype.scale = function (scaler) {
        this.x *= scaler;
        this.y *= scaler;
    };
    Vector.prototype.getNeg = function () {
        return this.getScaled(-1);
    };
    Vector.prototype.getMagnitude = function () {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    };
    Vector.prototype.getAddition = function (other) {
        return new Vector(this.x + other.x, this.y + other.y);
    };
    Vector.prototype.add = function (other) {
        this.x += other.x;
        this.y += other.y;
    };
    // self.diff(other) = other - self
    // self + self.diff(other) = other
    Vector.prototype.getDifference = function (other) {
        return new Vector(other.x - this.x, other.y - this.y);
    };
    // !!! Ignores zero vectors
    Vector.prototype.getNormalized = function () {
        var mag = this.getMagnitude();
        // Return <0,0> if input is zero vector
        if (mag === 0) {
            return new Vector(0, 0);
        }
        return new Vector(this.x / mag, this.y / mag);
    };
    // !!! Ignores zero vectors
    Vector.prototype.normalize = function () {
        var mag = this.getMagnitude();
        // Do nothing if zero vector
        if (mag === 0) {
            return;
        }
        this.x = this.x / mag;
        this.y = this.y / mag;
    };
    Vector.prototype.getDotProduct = function (other) {
        return this.x * other.x + this.y * other.y;
    };
    // Returns current vector projected onto a basis vector
    // (basis vector does not need to be unit length)
    Vector.prototype.getProjection = function (basis) {
        if (basis.getMagnitude() === 0) {
            console.error("Cannot project onto a zero basis vector");
        }
        var newMag = this.getDotProduct(basis) / Math.pow(basis.getMagnitude(), 2);
        return basis.getScaled(newMag);
    };
    // Input: angle in radians
    Vector.prototype.getRotated = function (theta) {
        var x = this.x * Math.cos(theta) - this.y * Math.sin(theta);
        var y = this.x * Math.sin(theta) + this.y * Math.cos(theta);
        return new Vector(x, y);
    };
    return Vector;
}());
var Ball = /** @class */ (function () {
    function Ball(pos, mass, radius, vel, color) {
        this.pos = pos;
        this.vel = vel !== null && vel !== void 0 ? vel : new Vector(0, 0);
        this.mass = mass !== null && mass !== void 0 ? mass : 1;
        this.radius = radius !== null && radius !== void 0 ? radius : 20;
        this.color = color !== null && color !== void 0 ? color : "black";
    }
    Ball.prototype.draw = function (ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
    };
    Ball.prototype.updatePosition = function () {
        this.pos.add(this.vel);
    };
    Ball.prototype.applyGravity = function (gravConst) {
        if (gravConst === void 0) { gravConst = 1; }
        this.vel.y += gravConst;
    };
    // Collides the ball elastically with a surface of infinite mass
    // Assumes the ball is already in perfect contact with the surface (ignores position)
    Ball.prototype.surfaceCollide = function (surfaceNormal) {
        var unitNormal = surfaceNormal.getNormalized(); // Unit normal vector of the surface
        var unitTangent = unitNormal.getRotated(0.5 * Math.PI); // Unit tangent vector of the surface
        var normalVel_i = this.vel.getProjection(unitNormal); // Normal component of initial ball velocity
        var tangentVel_i = this.vel.getProjection(unitTangent); // Tangent component of initial ball velocity
        var normalVel_f = normalVel_i.getNeg(); // Normal component of final ball velocity
        var tangentVel_f = tangentVel_i.getCopy(); // Tangent component of final ball velocity
        var velocity_f = normalVel_f.getAddition(tangentVel_f); // Final ball velocity
        // Wall impulse tracking
        var impulse = this.vel.getDifference(velocity_f).getScaled(this.mass);
        wallImpulseTracker.addEntry(createTimedValue(frameNum, impulse.getMagnitude()));
        this.vel = velocity_f;
    };
    Ball.prototype.applyWallCollision = function (xMin, yMin, xMax, yMax) {
        if (xMin === void 0) { xMin = 0; }
        if (yMin === void 0) { yMin = 0; }
        if (xMax === void 0) { xMax = canvas.width; }
        if (yMax === void 0) { yMax = canvas.height; }
        if (this.pos.x - this.radius < xMin) {
            this.pos.x = xMin + this.radius;
            this.surfaceCollide(new Vector(1, 0));
        }
        if (this.pos.x + this.radius > xMax) {
            this.pos.x = xMax - this.radius;
            this.surfaceCollide(new Vector(-1, 0));
        }
        if (this.pos.y - this.radius < yMin) {
            this.pos.y = yMin + this.radius;
            this.surfaceCollide(new Vector(0, 1));
        }
        if (this.pos.y + this.radius > yMax) {
            this.pos.y = yMax - this.radius;
            this.surfaceCollide(new Vector(0, -1));
        }
    };
    // Collides this ball with another ball, updates the vel of both
    // Ignores ball intersection/clipping issues!!!
    Ball.prototype.ballCollide = function (other) {
        var unitNormal = other.pos.getDifference(this.pos).getNormalized(); // Unit normal vector of the contact point surface
        var unitTangent = unitNormal.getRotated(0.5 * Math.PI); // Unit tangent vector of the contact point surface
        var m1 = this.mass;
        var m2 = other.mass;
        var normalMag_1_i = this.vel.getDotProduct(unitNormal); // Magnitude of the normal comp of this ball's initial vel
        var normalMag_2_i = other.vel.getDotProduct(unitNormal); // Magnitude of the normal comp of other ball's initial vel
        // Final tangent vel === initial tangent vel
        var tangentVel_1_f = this.vel.getProjection(unitTangent); // Tangent component of this ball's final vel
        var tangentVel_2_f = other.vel.getProjection(unitTangent); // Tangent component of other ball's final vel
        // Magnitude of the final normal velocities
        // Uses 1D elastic collision formulas along normal
        var normalMag_1_f = (((m1 - m2) * normalMag_1_i) + (2 * m2 * normalMag_2_i)) / (m1 + m2);
        var normalMag_2_f = (((m2 - m1) * normalMag_2_i) + (2 * m1 * normalMag_1_i)) / (m1 + m2);
        // Final velocity vectors of the two balls
        var vel_1_f = unitNormal.getScaled(normalMag_1_f).getAddition(tangentVel_1_f);
        var vel_2_f = unitNormal.getScaled(normalMag_2_f).getAddition(tangentVel_2_f);
        this.vel = vel_1_f;
        other.vel = vel_2_f;
        // Update positions to avoid clipping
        var surfacePos_1 = this.pos.getAddition(unitNormal.getScaled(-this.radius)); // Point on ball1 with closest dist to ball2
        var surfacePos_2 = other.pos.getAddition(unitNormal.getScaled(this.radius)); // Point on ball2 with closest dist to ball1
        var avgContactPos = surfacePos_1.getAddition(surfacePos_2).getScaled(0.5); // Average position of ball overlap
        this.pos = avgContactPos.getAddition(unitNormal.getScaled(this.radius));
        other.pos = avgContactPos.getAddition(unitNormal.getScaled(-other.radius));
    };
    // Collides balls if within reach and moving in correct direction
    Ball.prototype.attemptBallCollision = function (other) {
        // Ignore if balls are not touching
        if (Utils.getDist(this.pos, other.pos) >= this.radius + other.radius) {
            return;
        }
        // If balls have exact same pos, offset a bit to avoid division by zero
        if (this.pos.x === other.pos.x && this.pos.y === other.pos.y) {
            this.pos.x += 0.00001;
        }
        // Ignore if balls are moving away from each other
        var unitNormal = other.pos.getDifference(this.pos).getNormalized(); // Unit normal vector of the contact point
        var velRel = other.vel.getDifference(this.vel).getDotProduct(unitNormal); // Relative velocity along the normal
        if (velRel > 0) {
            return;
        }
        this.ballCollide(other);
    };
    return Ball;
}());
// !!! WORK IN PROGRESS
// TODO BUG: has some problems with tail segments moving
// (following the ball, when a new segment should have been created)
var TracerBall = /** @class */ (function (_super) {
    __extends(TracerBall, _super);
    function TracerBall(pos, mass, radius, vel, color, maxTailLength) {
        var _this = _super.call(this, pos, mass, radius, vel, color) || this;
        _this.tracerTail = [];
        _this.maxTailLength = maxTailLength !== null && maxTailLength !== void 0 ? maxTailLength : 200;
        return _this;
    }
    TracerBall.prototype.draw = function (ctx) {
        _super.prototype.draw.call(this, ctx);
        // Draw tail
        if (this.tracerTail.length !== 0) {
            var startPos = this.tracerTail[0];
            ctx.beginPath();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.moveTo(startPos.x, startPos.y);
            for (var _i = 0, _a = this.tracerTail; _i < _a.length; _i++) {
                var pos = _a[_i];
                ctx.lineTo(pos.x, pos.y);
            }
            ctx.stroke();
        }
    };
    TracerBall.prototype.updatePosition = function () {
        _super.prototype.updatePosition.call(this);
        console.log('e');
        this.tracerTail.push(this.pos);
        if (this.tracerTail.length > this.maxTailLength) {
            this.tracerTail.shift();
            console.log('x');
        }
    };
    return TracerBall;
}(Ball));
var ParticleFluid = /** @class */ (function () {
    function ParticleFluid(particleList, color, mass, radius) {
        this.particleList = particleList !== null && particleList !== void 0 ? particleList : [];
        this.color = color !== null && color !== void 0 ? color : "black";
        this.mass = mass !== null && mass !== void 0 ? mass : 1;
        this.radius = radius !== null && radius !== void 0 ? radius : 7;
    }
    ParticleFluid.prototype.createParticle = function (vel, pos, color, mass, radius) {
        radius = radius !== null && radius !== void 0 ? radius : this.radius;
        pos = pos !== null && pos !== void 0 ? pos : new Vector(Utils.getRandInt(radius, canvas.width - radius), Utils.getRandInt(radius, canvas.height - radius));
        vel = vel !== null && vel !== void 0 ? vel : new Vector(0, 0);
        color = color !== null && color !== void 0 ? color : this.color;
        mass = mass !== null && mass !== void 0 ? mass : this.mass;
        var particle = new Ball(pos, mass, radius, vel, color);
        this.particleList.push(particle);
    };
    ParticleFluid.prototype.createKEParticle = function (KE, pos, direction, color, mass, radius) {
        mass = mass !== null && mass !== void 0 ? mass : this.mass;
        // KE = 0.5 * m * (v**2)
        // v = sqrt(2 * KE / m)
        var speed = Math.sqrt(2 * KE / mass);
        var vel;
        if (direction === undefined) {
            var angle = Utils.getRandFloat(0, 2 * Math.PI);
            vel = (new Vector(speed, 0)).getRotated(angle);
        }
        else {
            vel = direction.getNormalized().getScaled(speed);
        }
        this.createParticle(vel, pos, color, mass, radius);
    };
    ParticleFluid.prototype.getParticleCount = function () {
        return this.particleList.length;
    };
    ParticleFluid.prototype.getAvgMomentum = function (particleList) {
        if (particleList === void 0) { particleList = this.particleList; }
        var totalMomentum = new Vector(0, 0);
        if (particleList.length === 0) {
            return totalMomentum;
        }
        for (var _i = 0, particleList_1 = particleList; _i < particleList_1.length; _i++) {
            var particle = particleList_1[_i];
            totalMomentum.add(particle.vel.getScaled(particle.mass));
        }
        return totalMomentum.getScaled(1 / particleList.length);
    };
    ParticleFluid.prototype.getAvgKE = function (particleList) {
        if (particleList === void 0) { particleList = this.particleList; }
        if (particleList.length === 0) {
            return 0;
        }
        var totalKE = 0;
        for (var _i = 0, particleList_2 = particleList; _i < particleList_2.length; _i++) {
            var particle = particleList_2[_i];
            totalKE += 0.5 * particle.mass * (Math.pow(particle.vel.getMagnitude(), 2));
        }
        return totalKE / particleList.length;
    };
    ParticleFluid.prototype.getAvgSpeed = function (particleList) {
        if (particleList === void 0) { particleList = this.particleList; }
        if (particleList.length === 0) {
            return 0;
        }
        var totalSpeed = 0;
        for (var _i = 0, particleList_3 = particleList; _i < particleList_3.length; _i++) {
            var particle = particleList_3[_i];
            totalSpeed += particle.vel.getMagnitude();
        }
        return totalSpeed / particleList.length;
    };
    // !!! Work in progress, for now is equivalent to getAvgKE
    ParticleFluid.prototype.getTemperature = function (particleList, R_constant) {
        if (R_constant === void 0) { R_constant = 1; }
        particleList = particleList !== null && particleList !== void 0 ? particleList : this.particleList;
        if (particleList.length === 0) {
            return 0;
        }
        // KE_total = (3/2)nRT
        // -> T = (2*KE_total)/(3*nR)
        // -> T = (2/3)*KE_avg*(1/R)
        var avgKE = this.getAvgKE(particleList);
        var temperature = (1) * avgKE / R_constant;
        return temperature;
    };
    // Adds/removes particles until count is met
    ParticleFluid.prototype.setParticleCount = function (count, newParticleKE) {
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
    };
    return ParticleFluid;
}());
// A stack of timed values
// !!! Timed values must be added in chronological order
var TimedStack = /** @class */ (function () {
    function TimedStack(maxCount) {
        this.entryList = [];
        this.maxCount = maxCount !== null && maxCount !== void 0 ? maxCount : 10000;
    }
    TimedStack.prototype.getTimeWindow = function () {
        if (this.entryList.length < 2) {
            return 0;
        }
        return (this.entryList[this.entryList.length - 1].timestamp - this.entryList[0].timestamp);
    };
    TimedStack.prototype.addEntry = function (entry) {
        // Error if entry is not in chronological order
        if (this.entryList.length !== 0 && entry.timestamp < this.entryList[this.entryList.length - 1].timestamp) {
            console.error("Entry is not in chronological order");
            return;
        }
        this.entryList.push(entry);
        if (this.entryList.length > this.maxCount) {
            this.entryList.shift();
        }
    };
    TimedStack.prototype.purgeOldEntries = function (oldestAcceptedTimestamp) {
        // Find oldest allowed entry
        for (var i = 0; i < this.entryList.length; i++) {
            if (this.entryList[i].timestamp >= oldestAcceptedTimestamp) {
                // Remove all previous entries
                this.entryList.splice(0, i);
                return;
            }
        }
        // All entries are too old
        this.entryList.splice(0);
    };
    TimedStack.prototype.getNewEntries = function (oldestAcceptedTimestamp) {
        // Find oldest wanted entry
        for (var i = 0; i < this.entryList.length; i++) {
            if (this.entryList[i].timestamp >= oldestAcceptedTimestamp) {
                // Return this and all later entries
                return this.entryList.slice(i);
            }
        }
        // No entries are new enough
        return [];
    };
    return TimedStack;
}());
// =================================================================================================
// ==== Main Code ==================================================================================
// =================================================================================================
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
// Inputs
var canvasResizer = document.getElementById("canvas-resizer");
var canvasResizeForm = document.getElementById("canvas-resize-form");
var heightInput = document.getElementById("height-input");
var widthInput = document.getElementById("width-input");
var particleCountForm = document.getElementById("particle-count-form");
var particleCountInput = document.getElementById("particle-count-input");
var particleCountSlider = document.getElementById("particle-count-slider");
// Readings
var volumeReading = document.getElementById("volume-reading");
var particleCountReading = document.getElementById("particle-count-reading");
var temperatureReading = document.getElementById("temperature-reading");
var pressureReading = document.getElementById("pressure-reading");
var avgKEReading = document.getElementById("avg-ke-reading");
// Consts
var CANVAS_RECT = canvas.getBoundingClientRect();
var FPS = 20;
var canvasSize;
updateCanvasSize();
// ==== Global Vars ==================================
var isPaused = false;
var allowCollisions = true;
var initalBallCount = 1000;
var initialBallKE = 100;
var ballRadius = 7;
// ==== Tracking Vars ==================================
var frameNum = 0;
var wallImpulseTracker = new TimedStack();
// ==== Initial Setup ==================================
var defaultGas = new ParticleFluid(undefined, undefined, undefined, ballRadius);
for (var i = 0; i < initalBallCount; i++) {
    defaultGas.createKEParticle(initialBallKE);
}
updateParticleCount();
// Set frame rate
setInterval(updateFrame, 1000 / FPS);
// =================================================================================================
// ==== Functions ==================================================================================
// =================================================================================================
// ==== UTILITY FUNCTIONS ==================================
function createTimedValue(timestamp, value) {
    return { timestamp: timestamp, value: value };
}
function getCursorPosition(event) {
    var x = event.clientX - CANVAS_RECT.left;
    var y = event.clientY - CANVAS_RECT.top;
    return new Vector(x, y);
}
function resizeCanvas(newSize) {
    var snapSize = 1;
    var minSize = 1;
    var newHeight = Math.max(minSize, Math.floor(newSize.height / snapSize) * snapSize);
    var newWidth = Math.max(minSize, Math.floor(newSize.width / snapSize) * snapSize);
    // Resize canvas and canvasResizer
    canvas.height = newHeight;
    canvas.width = newWidth;
    canvasResizer.style.height = "".concat(newHeight, "px");
    canvasResizer.style.width = "".concat(newWidth, "px");
    // Update resizing input placeholder values
    heightInput.placeholder = newHeight;
    widthInput.placeholder = newWidth;
    heightInput.value = "";
    widthInput.value = "";
    canvasSize = { height: newHeight, width: newWidth };
    console.log("Container Resized!");
}
function updateCanvasSize(prevSize) {
    if (prevSize === undefined || prevSize.height !== canvas.clientHeight || prevSize.width !== canvas.clientWidth) {
        resizeCanvas({ height: canvas.clientHeight, width: canvas.clientWidth });
    }
}
function updateParticleCount() {
    particleCountInput.placeholder = defaultGas.getParticleCount();
    particleCountInput.value = "";
    particleCountSlider.value = defaultGas.getParticleCount();
}
// ==== TRACKING FUNCTIONS ==================================
function maxwellBoltzmannDist(speed, mass, temp, k) {
    if (k === void 0) { k = 1; }
    var kT = k * temp;
    return (mass * speed / kT) * Math.exp(-(mass * Math.pow(speed, 2)) / (2 * kT));
}
function updateHistogram(balls) {
    if (balls === void 0) { balls = defaultGas.particleList; }
    var binSize = 2; // (default 2)
    var xUpperbound = 80; // (default 80)
    var yUpperBound = 20; // in percent (default 20)
    var ballSpeeds = [];
    for (var _i = 0, balls_1 = balls; _i < balls_1.length; _i++) {
        var ball = balls_1[_i];
        ballSpeeds.push(ball.vel.getMagnitude());
    }
    var speedHist = {
        x: ballSpeeds,
        type: 'histogram',
        histnorm: "percent",
        xbins: {
            start: 0,
            end: xUpperbound,
            size: binSize
        },
        marker: {
            color: 'skyblue',
        },
        name: 'Particle Speeds',
    };
    // Generate data for Maxwell-Boltzmann curve
    var x_vals = [];
    var y_vals = [];
    for (var x = 0; x < xUpperbound; x += 0.1) {
        x_vals.push(x);
        y_vals.push(100 * binSize * maxwellBoltzmannDist(x, 1, initialBallKE));
    }
    var funcLine = {
        x: x_vals,
        y: y_vals,
        type: 'scatter',
        mode: 'lines',
        line: { color: 'green' },
        name: 'Maxwell-Boltzmann',
    };
    var layout = {
        title: { text: "Speed Distribution" },
        xaxis: {
            title: { text: "Speed" },
            range: [0, xUpperbound]
        },
        yaxis: {
            title: { text: "Percent %" },
            range: [0, yUpperBound]
        },
        bargap: 0.05
    };
    var traces = [speedHist, funcLine];
    // @ts-ignore
    Plotly.newPlot('histogram1', traces, layout, { displayModeBar: false });
}
// ==== DRAW FUNCTIONS ==================================
function drawFrame() {
    updateCanvasSize(canvasSize);
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw balls
    for (var _i = 0, _a = defaultGas.particleList; _i < _a.length; _i++) {
        var ball = _a[_i];
        ball.draw(ctx);
    }
}
function updateUI() {
    updateHistogram(defaultGas.particleList);
    var avgingWindow = Utils.bound(wallImpulseTracker.getTimeWindow(), 1, 20);
    var volume = canvas.width * canvas.height;
    var area = 2 * (canvas.width + canvas.height);
    // Averages the values of every timed number within the averaging window
    var impulseList = wallImpulseTracker.getNewEntries(frameNum - avgingWindow);
    var impulsePerFrame = impulseList.reduce(function (acc, timedValue) { return (acc + timedValue.value); }, 0) / avgingWindow;
    var pressure = impulsePerFrame / area;
    // Update readings
    volumeReading.innerText = volume.toString();
    particleCountReading.innerText = defaultGas.getParticleCount().toString();
    temperatureReading.innerText = defaultGas.getTemperature().toFixed(2).toString();
    avgKEReading.innerText = defaultGas.getAvgKE().toFixed(2).toString();
    pressureReading.innerText = pressure.toFixed(5).toString();
}
function updateFrame() {
    updateUI();
    drawFrame();
    // Ignore if paused
    if (isPaused) {
        return;
    }
    // Tracking
    frameNum += 1;
    // Update balls position
    for (var _i = 0, _a = defaultGas.particleList; _i < _a.length; _i++) {
        var ball = _a[_i];
        // ball.applyGravity();
        ball.updatePosition();
        ball.applyWallCollision();
    }
    // Loops through every pair of balls without duplicates
    for (var i = 0; i < defaultGas.particleList.length; i++) {
        for (var j = i + 1; j < defaultGas.particleList.length; j++) {
            var ball1 = defaultGas.particleList[i];
            var ball2 = defaultGas.particleList[j];
            if (allowCollisions) {
                ball1.attemptBallCollision(ball2);
            }
        }
    }
}
// =================================================================================================
// ==== EVENT HANDLERS =============================================================================
// =================================================================================================
var pauseButton = document.getElementById("pause-button");
pauseButton.addEventListener("click", function (event) {
    if (isPaused) {
        isPaused = false;
        pauseButton.innerText = "Pause";
    }
    else {
        isPaused = true;
        pauseButton.innerText = "Unpause";
    }
});
canvas.addEventListener("mousedown", function (event) {
    var mousePos = getCursorPosition(event);
    // defaultGas.createParticle(new Vector(0, 0), mousePos, "red", undefined, 15)
    defaultGas.particleList.push(new TracerBall(mousePos, undefined, 15, undefined, "red"));
});
document.addEventListener("keydown", function (event) {
    if (event.key === " ") {
        allowCollisions = !allowCollisions;
    }
});
canvasResizeForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var submittedHeight = heightInput.value;
    var submittedWidth = widthInput.value;
    if (submittedHeight === "") {
        submittedHeight = canvasSize.height;
    }
    if (submittedWidth === "") {
        submittedWidth = canvasSize.width;
    }
    var newSize = { height: parseInt(submittedHeight), width: parseInt(submittedWidth) };
    resizeCanvas(newSize);
});
particleCountForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var submittedParticleCount = particleCountInput.value;
    if (submittedParticleCount === "") {
        return;
    }
    defaultGas.setParticleCount(parseInt(submittedParticleCount), initialBallKE);
    updateParticleCount();
});
particleCountSlider.addEventListener("input", function (event) {
    defaultGas.setParticleCount(this.value, initialBallKE);
    updateParticleCount();
});
