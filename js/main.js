console.clear();

// Adapted from https://codepen.io/FWeinb/pen/JhzvI
// Based on http://www.dgp.toronto.edu/people/stam/reality/Research/pdf/GDC03.pdf

const NavierStokes = require('./navierStokes');
const Display = require('./display');
const User = require('./user');

var fluid = new NavierStokes({
	callbackDisplay(D, U, V, size) {
		display.density(D, U, V, size);
	},
	callbackUser(D, U, V, size) {
		user.interact(D, U, V, size);
	}
});

var canvas = document.getElementById('d');
var display = new Display(canvas, fluid);
var user = new User(canvas, fluid, display);

var reset = () => {
	fluid.init();
	user.setCanvasSize(fluid.resolution);
	display.init(fluid.resolution);
};

var loop = () => {
	fluid.update();
	requestAnimationFrame(loop);
};

reset();
loop();


// dat.GUI Settings
var gui = new window.dat.GUI();
var fluidFolder = gui.addFolder('Fluid');

fluidFolder.add(fluid, 'resolution', [64, 128, 256, 512]).onFinishChange(function(e) {
	fluid.resolution = parseInt(e);
	reset();
});

fluidFolder.add(fluid, 'iterations', 1, 100).onFinishChange(function(e) {
	fluid.iterations = parseInt(e);
});

fluidFolder.add(fluid, 'diffusion', 0.9000000, 1.1000000);
fluidFolder.add(fluid, 'dt', -1, 1);

fluidFolder.add(user, 'insertedDensity', 0, 200).onFinishChange(function(e) {
	user.insertedDensity = parseInt(e);
});
fluidFolder.open();

var displayFolder = gui.addFolder('Display');

displayFolder.add(user, 'displaySize', 0, 900).onChange(function(e) {
	user.setDisplay(e);
});


var currColorFunc = displayFolder.add(display, 'currColorFunc', {
	'Black & White': 'BW',
	'Color': 'Color',
	'User Defined': 'User'
});
var setColorFuncToUser = function() {
	display.currColorFunc = 'User';
	currColorFunc.updateDisplay();
};
displayFolder.add(display.colorUser, 'R', 0, 50).name('R:').onChange(setColorFuncToUser);
displayFolder.add(display.colorUser, 'G', 0, 1000).name('G:').onChange(setColorFuncToUser);
displayFolder.add(display.colorUser, 'B', 0, 50).name('B:').onChange(setColorFuncToUser);
displayFolder.open();

gui.add(user, 'clearDisplay').name('Clear');
