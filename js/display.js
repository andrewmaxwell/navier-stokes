class Display {
	constructor(canvas, fluid) {
		this.colorFunctions = {
			BW: this.calcColorBW,
			Color: this.calcColor,
			User: this.calcUserColor
		};
		this.currColorFunc = 'BW';
		this.canvas = canvas;
		this.context = canvas.getContext('2d', {
			alpha: false
		});

		this.colorUser = {
			R: 0,
			G: 255,
			B: 0
		};
		this.fluid = fluid;
	}
	init(res) {
		this.calcResolution = res;
		this.imageData = this.context.createImageData(this.calcResolution, this.calcResolution);
		this.showColors = false;
		this.line = null;
	}
	density(D, U, V) {
		for (var x = 0; x < this.calcResolution; x++) {
			for (var y = 0; y < this.calcResolution; y++) {
				var pos = x + y * this.fluid.rows;
				var posC = (x + y * this.calcResolution) * 4;
				var cArray = this.colorFunctions[this.currColorFunc].call(this, D, U, V, pos);
				this.imageData.data[posC + 0] = cArray[0]; // R
				this.imageData.data[posC + 1] = cArray[1]; // G
				this.imageData.data[posC + 2] = cArray[2]; // B
				this.imageData.data[posC + 3] = 255; //A
			}
		}
		this.context.putImageData(this.imageData, 0, 0);

		// Draw the line for creating an Emitter
		if (this.line !== null) {
			this.context.beginPath();
			this.context.lineWidth = 1;
			this.context.strokeStyle = 'white';
			this.context.moveTo(this.line[0][0], this.line[0][1]);
			this.context.lineTo(this.line[1][0], this.line[1][1]);
			this.context.stroke();
		}
	}

	setColorFunction(colorFuncName) {
		this.currColorFunc = colorFuncName;
	}

	calcColorBW(D, U, V, pos) {
		var bw = (D[pos] * 255 / 6) | 0;
		return [bw, bw, bw];
	}

	calcColor(D, U, V, pos) {
		var r = Math.abs((U[pos] * 1300) | 0);
		var b = Math.abs((V[pos] * 1300) | 0);
		var g = (D[pos] * 255 / 6) | 0;

		return [r, g, b];
	}

	calcUserColor(D, U, V, pos) {
		var r = Math.abs((U[pos] * 500 * this.colorUser.R) | 0);
		var g = (D[pos] * this.colorUser.G) | 0;
		var b = Math.abs((V[pos] * 500 * this.colorUser.B) | 0);

		return [r, g, b];
	}

	drawLine(a0, a1, scale) {
		var l0 = [a0[0] * scale, a0[1] * scale];
		var l1 = [a1[0] * scale, a1[1] * scale];

		this.line = [l0, l1];
	}

	removeLine() {
		this.line = null;
	}
}

module.exports = Display;
