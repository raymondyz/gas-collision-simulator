// ==================================================================================================
// ==== Classes =====================================================================================
// ==================================================================================================
var Vector = /** @class */ (function () {
    function Vector(x, y) {
        if (x === void 0) { x = 1; }
        if (y === void 0) { y = 1; }
        this.x = x;
        this.y = y;
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
    Vector.prototype.getNormalized = function () {
        var mag = this.getMagnitude();
        // Return <0,0> if input is zero vector
        if (mag === 0) {
            return new Vector(0, 0);
        }
        return new Vector(this.x / mag, this.y / mag);
    };
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
    // (function automatically normalizes basis vector)
    Vector.prototype.getProjection = function (basis) {
        var newMag = this.getDotProduct(basis); // / basis.getMagnitude()**2
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
    function Ball(pos, mass, radius, vel) {
        if (mass === void 0) { mass = 1; }
        if (radius === void 0) { radius = 20; }
        if (vel === void 0) { vel = new Vector(0, 0); }
        this.pos = pos;
        this.vel = vel;
        this.mass = mass;
        this.radius = radius;
        this.color = "black";
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
        trackNewWallImpulse(impulse.getMagnitude());
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
        if (getDist(this.pos, other.pos) >= this.radius + other.radius) {
            return;
        }
        // If balls have exact same pos, offset a bit
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
// class ParticleFluid {
//   particleList: Ball[];
//   color: string;
//   constructor(particleList: Ball[] = [], color: string = "black") {
//     this.particleList = particleList;
//     this.color = color;
//   }
// }
// ==================================================================================================
// ==== Main Code ===================================================================================
// ==================================================================================================
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
var canvasResizer = document.getElementById("canvas-resizer");
var volumeReading = document.getElementById("volume-reading");
var amountReading = document.getElementById("amount-reading");
var temperatureReading = document.getElementById("temperature-reading");
var CANVAS_RECT = canvas.getBoundingClientRect();
var FPS = 20;
var canvasSize = updateCanvasSize();
// ==== Global Vars ==================================
var isPaused = false;
var allowCollisions = true;
var initalBallAmount = 1000;
var initialBallSpeed = 15;
var ballRadius = 7;
// ==== Tracking Vars ==================================
var frameNum = 0;
var totalWallImpulse = 0;
var trackingTime = 500;
// ==== Initial Setup ==================================
var ballList = [];
for (var i = 0; i < initalBallAmount; i++) {
    var newBall = createRandBall(initialBallSpeed, ballRadius);
    // if (newBall.pos.x > 500) {
    //   newBall.color = "red";
    //   newBall.mass = 50
    // }
    ballList.push(newBall);
}
// Set frame rate
setInterval(updateFrame, 1000 / FPS);
// ==================================================================================================
// ==== Functions ===================================================================================
// ==================================================================================================
// ==== UTILITY FUNCTIONS ==================================
function getDist(vec1, vec2) {
    return Math.sqrt(Math.pow((vec1.x - vec2.x), 2) + Math.pow((vec1.y - vec2.y), 2));
}
function getRandFloat(min, max) {
    return Math.random() * (max - min) + min;
}
function updateCanvasSize(prevSize) {
    if (prevSize === void 0) { prevSize = null; }
    var snapSize = 1;
    var minSize = 1;
    if (prevSize === null || prevSize.height !== canvas.clientHeight || prevSize.width !== canvas.clientWidth) {
        var newHeight = Math.max(minSize, Math.floor(canvas.clientHeight / snapSize) * snapSize);
        var newWidth = Math.max(minSize, Math.floor(canvas.clientWidth / snapSize) * snapSize);
        canvas.height = newHeight;
        canvas.width = newWidth;
        canvasResizer.style.height = "".concat(newHeight, "px");
        canvasResizer.style.width = "".concat(newWidth, "px");
        isPaused = true;
        console.log("Container Resized!");
    }
    else {
        isPaused = false;
    }
    return { height: canvas.clientHeight, width: canvas.clientWidth };
}
// Random integer from min to max inclusive
function getRandInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function bound(value, min, max) {
    return Math.max(Math.min(value, max), min);
}
function createRandBall(speed, radius, mass) {
    if (speed === void 0) { speed = 10; }
    if (radius === void 0) { radius = 20; }
    if (mass === void 0) { mass = 1; }
    var angle = getRandFloat(0, 2 * Math.PI);
    var vel = new Vector(speed, 0);
    var pos = new Vector(getRandInt(radius, canvas.width - radius), getRandInt(radius, canvas.height - radius));
    return new Ball(pos, mass, radius, vel.getRotated(angle));
}
function getCursorPosition(event) {
    var x = event.clientX - CANVAS_RECT.left;
    var y = event.clientY - CANVAS_RECT.top;
    return new Vector(x, y);
}
// ==== TRACKING FUNCTIONS ==================================
function getAvgMomentum(balls) {
    if (balls === void 0) { balls = ballList; }
    var totalMomentum = new Vector(0, 0);
    if (balls.length === 0) {
        return totalMomentum;
    }
    for (var _i = 0, balls_1 = balls; _i < balls_1.length; _i++) {
        var ball = balls_1[_i];
        totalMomentum.add(ball.vel.getScaled(ball.mass));
    }
    return totalMomentum.getScaled(1 / balls.length);
}
function getAvgKE(balls) {
    if (balls === void 0) { balls = ballList; }
    if (balls.length === 0) {
        return 0;
    }
    var totalKE = 0;
    for (var _i = 0, balls_2 = balls; _i < balls_2.length; _i++) {
        var ball = balls_2[_i];
        totalKE += 0.5 * ball.mass * (Math.pow(ball.vel.getMagnitude(), 2));
    }
    return totalKE / balls.length;
}
function getAvgSpeed(balls) {
    if (balls === void 0) { balls = ballList; }
    if (balls.length === 0) {
        return 0;
    }
    var totalSpeed = 0;
    for (var _i = 0, balls_3 = balls; _i < balls_3.length; _i++) {
        var ball = balls_3[_i];
        totalSpeed += ball.vel.getMagnitude();
    }
    return totalSpeed / balls.length;
}
function getAvgSpeedDev(balls) {
    if (balls === void 0) { balls = ballList; }
    if (balls.length === 0) {
        return 0;
    }
    var avgSpeed = getAvgSpeed(balls);
    var totalDev = 0;
    for (var _i = 0, balls_4 = balls; _i < balls_4.length; _i++) {
        var ball = balls_4[_i];
        totalDev += Math.pow((avgSpeed - ball.vel.getMagnitude()), 2);
    }
    return totalDev / balls.length;
}
function getTemperature(balls, R_constant) {
    if (balls === void 0) { balls = ballList; }
    if (R_constant === void 0) { R_constant = 1; }
    if (balls.length === 0) {
        return 0;
    }
    // KE_total = (3/2)nRT
    // -> T = (2*KE_total)/(3*nR)
    // -> T = (2/3)*KE_avg*(1/R)
    var avgKE = getAvgKE(balls);
    var temperature = (1) * avgKE / R_constant;
    return temperature;
}
function updateHistogram(balls) {
    if (balls === void 0) { balls = ballList; }
    var ballSpeeds = [];
    for (var _i = 0, balls_5 = balls; _i < balls_5.length; _i++) {
        var ball = balls_5[_i];
        ballSpeeds.push(ball.vel.getMagnitude());
    }
    var trace = {
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
    var layout = {
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
    var data = [trace];
    // @ts-ignore
    Plotly.newPlot('histogram1', data, layout);
}
function trackNewWallImpulse(impulse) {
    totalWallImpulse += impulse;
}
// ==== OTHER FUNCTIONS ==================================
function drawVector(ctx, posX, posY, magX, magY) {
    var toX = posX + magX;
    var toY = posY + magY;
    ctx.beginPath();
    ctx.arc(posX, posY, 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(posX, posY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
}
// ==== DRAW FUNCTIONS ==================================
function drawFrame() {
    canvasSize = updateCanvasSize(canvasSize);
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw balls
    for (var _i = 0, ballList_1 = ballList; _i < ballList_1.length; _i++) {
        var ball = ballList_1[_i];
        ball.draw(ctx);
    }
}
function updateUI() {
    updateHistogram(ballList);
    var volume = canvas.width * canvas.height;
    volumeReading.innerText = volume.toString();
    amountReading.innerText = ballList.length.toString();
    temperatureReading.innerHTML = getTemperature(ballList).toFixed(2).toString();
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
    for (var _i = 0, ballList_2 = ballList; _i < ballList_2.length; _i++) {
        var ball = ballList_2[_i];
        // ball.applyGravity();
        ball.updatePosition();
        ball.applyWallCollision();
    }
    // Loops through every pair of balls without duplicates
    for (var i = 0; i < ballList.length; i++) {
        for (var j = i + 1; j < ballList.length; j++) {
            var ball1 = ballList[i];
            var ball2 = ballList[j];
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
    var mousePos = getCursorPosition(e);
    var ball = new Ball(mousePos);
    ballList.push(ball);
});
document.addEventListener("keydown", function (e) {
    if (e.key === " ") {
        allowCollisions = !allowCollisions;
    }
});
