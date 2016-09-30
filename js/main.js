console.clear();

// Adapted from https://codepen.io/FWeinb/pen/JhzvI
// Based on http://www.dgp.toronto.edu/people/stam/reality/Research/pdf/GDC03.pdf

// const Fluid = require('./containedFluid');
const Fluid = require('./toroidFluid');
const Display = require('./display');
const ParticleSystem = require('./particleSystem');
const Demo = require('./demo');

var params = {
	rows: 100,
	iterations: 50,
	diffusion: 0.999,
	speed: 10,
	pushStrength: 1,
	pushAmount: 5,
	red: 1300,
	green: 255,
	blue: 1300
};

var fluid = window.top.fluid = new Fluid(params);
var display = new Display(params);
var particles = window.top.particles = new ParticleSystem(params);

new Demo({
	reset(){
		fluid.reset();
	},
	loop(){
		fluid.iterate();
		particles.iterate(fluid);
		display.renderFluid(fluid);
		display.renderParticles(particles);
	}
});

display.topCanvas.onmousemove = e => {
	var x = e.offsetX / display.width;
	var y = e.offsetY / display.width;
	var dx = e.movementX / display.width;
	var dy = e.movementY / display.width;
	fluid.interact(x, y, dx, dy);
};

var gui = new window.dat.GUI();
gui.add(params, 'rows', 50, 300).step(1).onChange(() => fluid.reset());
gui.add(params, 'iterations', 1, 200);
gui.add(params, 'diffusion', 0.99, 1);
gui.add(params, 'speed', 0, 100);
gui.add(params, 'pushAmount', 0, 10);
gui.add(params, 'pushStrength', 0, 10);
