class User {
	constructor(canvas, fluid, display){
		this.displaySize = 500;
		this.canvas = null;
		this.scale = 0;

		this.mouseStart = [];
		this.mouseEnd = [];
		this.mouseLeftDown = false;
		this.mousePath = [];

		this.mouseRightDown = false;
		this.mouseRightStart = [];

		this.forceEmitters = [];

		this.insertedDensity = 50;

		this.canvas = canvas;
		this.fluid = fluid;
		this.display = display;

		window.ontouchend = window.onmouseup = e => this.handleInputEnd(e);
		canvas.ontouchstart = canvas.onmousedown = e => this.handleInput(e);
		canvas.ontouchmove = canvas.onmousemove = e => this.handleInputMove(e);
		canvas.oncontextmenu = e => e.preventDefault();
	}
	interact(D, U, V) {
		var x, y, pos, i;

		if (this.mouseLeftDown) {
			var dx = this.mouseStart[0] - this.mouseEnd[0];
			var dy = this.mouseStart[1] - this.mouseEnd[1];

			var mousePathLength = Math.max(1, Math.sqrt(dx * dx + dy * dy) | 0);

			for (i = 0; i < mousePathLength; i++) {
				x = (((this.mouseStart[0] - (i / mousePathLength) * dx)) * this.scale) | 0;
				y = (((this.mouseStart[1] - (i / mousePathLength) * dy)) * this.scale) | 0;

				pos = x + y * this.fluid.rows;

				U[pos] = -dx / 6;
				V[pos] = -dy / 6;
				D[pos] = this.insertedDensity;
			}
			this.mouseStart[0] = this.mouseEnd[0];
			this.mouseStart[1] = this.mouseEnd[1];
		}

		for (i = 0; i < this.forceEmitters.length; i++) {
			var posDir = this.forceEmitters[i];
			var pos = posDir[0] * (this.scale | 0) + (posDir[1] * this.scale | 0) * this.fluid.rows;
			U[pos] = posDir[2];
			V[pos] = posDir[3];
		}

	}

	clearDisplay() {
		this.fluid.clear();
		this.forceEmitters = [];
	}

	setDisplay(e) {
		var displaySize = parseInt(e);
		if (displaySize === 0) { // 1:1
			this.setDisplaySize(this.fluid.resolution);
		} else {
			this.setDisplaySize(displaySize);
		}
	}
	setCanvasSize(size) {
		this.canvas.width = this.canvas.height = size;
		this.calculateScale();
	}

	setDisplaySize(size) {
		this.canvas.style.width = this.canvas.style.height = size + 'px';
		this.calculateScale();
	}

	calculateScale() {
		this.scale = this.fluid.resolution / this.canvas.clientWidth;
	}

	handleInput(e) {
		var mPos = [e.offsetX, e.offsetY];
		if (e.type === 'touchstart') {
			this.mouseLeftDown = true;
			this.mouseEnd = this.mouseStart = mPos;
		} else if (e.button !== undefined) {
			if (e.button == 0) {
				this.mouseLeftDown = true;
				this.mouseEnd = this.mouseStart = mPos;
			} else if (e.button == 2) {
				this.mouseRightDown = true;
				this.mouseRightStart = mPos;
			}
		}
		e.preventDefault();
	}

	handleInputMove(e) {
		var mPos = [e.offsetX, e.offsetY];
		if (this.mouseLeftDown) this.mouseEnd = mPos;
		if (this.mouseRightDown) {
			this.display.drawLine(this.mouseRightStart, mPos, this.scale);
		}
	}
	handleInputEnd(e) {
		this.mouseLeftDown = false;
		if (this.mouseRightDown) {
			this.mouseRightDown = false;
			var endPos = [e.offsetX, e.offsetY];
			var x = this.mouseRightStart[0];
			var y = this.mouseRightStart[1];

			var dx = (endPos[0] - x) / 10;
			var dy = (endPos[1] - y) / 10;
			this.forceEmitters.push([x, y, dx, dy]);
			this.display.removeLine();
		}
	}
};

module.exports = User;
