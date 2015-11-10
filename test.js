paper.install(window); // inject paper scope into global js scope

window.onload = function() {

  //------------------- INITIAL CANVAS SETUP -------------------

  // Setup directly from canvas id:
  paper.setup('testCanvas');
  
  /*
  
  Rotate the bubble with an entering particle so that the particle
  always enters through the 0-segment point on the bubble path.
  The 0-segment point will be pushed inwards as a function of the
  distance between the bubble center and the particle center. 
  
  When the particle is absorbed, a wave will travel from the 0-segment
  point to its neighbors, and the radius will be expanded slightly
  wider as the wave travels.
  
  */
  
  //-------------------- Physics Constants ---------------------
  var constants = {
    friction  : 5,    // against springs in N
    mass      : 10,   // mass of each spring on surface in kg
    stiffness : 5,    // kg/s^2
    timeStep  : 0.01 // animation frame -> simulation time in sec
  }
  
  //---------------------- Spring Object -----------------------
  function Spring() {
    this.force;
    this.displacement;
    this.displacementPrev;
    this.stiffness;
  }
  
  //---------------------- Bubble Object -----------------------
  
  function Bubble(p, c) {
    this.point = p;
    this.count = c;
    this.radius = 100;
    this.surfaceResistance = 0.5; // value between 0 to 1.
    this.angle = 0;
    this.edgePointsPolar = [];
    this.edgeOffset = [];
    this.numSegments = 2 * Math.floor(this.radius / 30); // always even number
    this.path = new Path({
      blendMode: 'xor',
      closed: true,
      fillColor: 'black',
      fullySelected: true
    });
    
    for (var i = 0; i < this.numSegments; i++) {
      this.edgePointsPolar.push(new Point({
        angle: 360 / this.numSegments * i,
        length: this.radius
      }));
      this.path.add(this.point.add(this.edgePointsPolar[i]));
    }
    
    this.path.smooth();
  }
  
  Bubble.prototype = {
//    interact: function(particle) {
//      var d = this.point.getDistance(particle.point);
//      var exceed = this.radius + particle.radius - d;
//      var pr = particle.radius;
//      if (exceed > 0 && exceed < 2 * pr) {
//        var angleDiff = ((this.point.subtract(particle.point).angle + 180) % 360) - this.angle;
//        this.path.rotate(angleDiff);
//        this.angle = (this.angle + angleDiff) % 360;
//        this.path.segments[0].point = this.point.add(new Point({
//          angle: this.angle,
//          length: this.radius - (-pr * Math.pow((1 / (2 * pr)) * exceed - 1, 2) + pr)
//        }));
//      } else if (exceed > 2 * particle.radius) {
//        
//      }
//    }
    
  };
  
  
  //--------------------- Particle Object ----------------------
  
  function Particle(p, r) {
    this.point = p;
    this.radius = r;
    this.path = new Path.Circle(p, r);
    this.path.fillColor = 'red';
  }
  
  Particle.prototype = {
    moveTo: function(p) {
      this.path.position = p;
      this.point = p;
    }
  }
  
  //-------------------------- main ----------------------------
  
  var bubbles = [];
  var numBubbles = 1;
  
  for (var i = 0; i < numBubbles; i++) {
//    var position = Point.random().multiply(view.size);
    var position = new Point(100, 100);
    bubbles.push(new Bubble(position, 0));
  }

  
  var particles = [];
  var numParticles = 1;
  var particleRadius = 30;
  
  for (var i = 0; i < numParticles; i++) {
    var position = new Point(300, 300);
    particles.push(new Particle(position, particleRadius));
  }
    
  
  var tool = new Tool();
  var heldParticleIndex = -1; // no particle is held by default.
  
  tool.onMouseDown = function(event) {
    for (var i = 0; i < particles.length; i++) {
      if (event.point.isClose(particles[i].point, particles[i].radius)) { // Hold particle
        heldParticleIndex = i;
        break; // break loop when a particle has been detected and held.
      }
    }
  }
  
  tool.onMouseDrag = function(event) {
    if (heldParticleIndex > -1) {
      particles[heldParticleIndex].moveTo(event.point);
      for (var i = 0; i < bubbles.length; i++) {
        bubbles[i].interact(particles[heldParticleIndex]);
      }
    }
  }
  
  tool.onMouseUp = function(event) {
    if (heldParticleIndex > -1) {
      particles[heldParticleIndex].moveTo(event.point);
      heldParticleIndex = -1;
    }
  }
  
  view.draw(); // method required to update canvas.
  
};