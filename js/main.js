console.clear();

// Adapted from https://codepen.io/FWeinb/pen/JhzvI
// Based on http://www.dgp.toronto.edu/people/stam/reality/Research/pdf/GDC03.pdf

const Fluid = require('./fluid');
const Display = require('./display');
const Demo = require('./demo');

var params = {
	rows: 100,
	iterations: 50,
	diffusion: 0.999,
	speed: 0.1,
	pushStrength: 1,
	pushAmount: 5,
	red: 1300,
	green: 255,
	blue: 1300
};

var fluid = window.top.fluid = new Fluid(params);
var display = new Display(params);

new Demo({
	reset(){
		fluid.reset();
	},
	loop(){
		fluid.update();
		display.render(fluid);
	}
});

display.topCanvas.onmousemove = e => {
	var x = e.offsetX / display.width;
	var y = e.offsetY / display.width;
	var px = x - e.movementX / display.width;
	var py = y - e.movementY / display.width;
	fluid.interact(x, y, px, py);
};

var gui = new window.dat.GUI();
gui.add(params, 'rows', 50, 300).step(1).onChange(() => fluid.reset());
gui.add(params, 'iterations', 1, 100);
gui.add(params, 'diffusion', 0.99, 1);
gui.add(params, 'speed', 0, 0.2);
gui.add(params, 'pushAmount', 0, 200);
gui.add(params, 'pushStrength', 0, 100);
