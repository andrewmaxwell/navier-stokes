class NavierStokes {
	constructor(settings){

		this.resolution = 64;
		this.iterations = 10;
		this.fract = 0.25;
		this.diffusion = 1;
		this.gridmodify = 0;
		this.dt = 0.1;
		Object.keys(settings || {}).forEach(key => this[key] = settings[key]);
		this.init();
	}

	init() {
		this.rows = this.resolution + 2;
		this.arraySize = this.rows * this.rows;

		this.U = new Float32Array(this.arraySize);
		this.V = new Float32Array(this.arraySize);
		this.D = new Float32Array(this.arraySize);

		this.U_prev = new Float32Array(this.arraySize);
		this.V_prev = new Float32Array(this.arraySize);
		this.D_prev = new Float32Array(this.arraySize);
	}

	clear() {
		this.D.fill(0);
		this.U.fill(0);
		this.V.fill(0);
	}

	update() {
		// Add user Action
		this.D_prev.fill(0);
		this.U_prev.fill(0);
		this.V_prev.fill(0);
		this.callbackUser(this.D_prev, this.U_prev, this.V_prev, this.resolution);

		for (var i = 0; i < this.arraySize; i++) {
			this.D[i] += this.D_prev[i] * this.dt;
			this.U[i] += this.U_prev[i] * this.dt;
			this.V[i] += this.V_prev[i] * this.dt;

			this.D_prev[i] = this.D[i] * this.diffusion;
			this.U_prev[i] = this.U[i] * this.diffusion;
			this.V_prev[i] = this.V[i] * this.diffusion;
		}

		this.set_bnd(0, this.D_prev);
		this.set_bnd(1, this.U_prev);
		this.set_bnd(2, this.V_prev);

		this.project(this.U_prev, this.V_prev, this.U, this.V);
		this.advect(1, this.U, this.U_prev, this.U_prev, this.V_prev);
		this.advect(2, this.V, this.V_prev, this.U_prev, this.V_prev);
		this.project(this.U, this.V, this.U_prev, this.V_prev);

		this.advect(0, this.D, this.D_prev, this.U, this.V);

		this.callbackDisplay(this.D, this.U, this.V, this.resolution);
	}

	project(u, v, p, div) {
		var i, j, k, thisRow, nextRow, lastRow, valueBefore, valueNext, prevX;

		var prevRow, to;
		for (i = 1; i <= this.resolution; i++) {
			prevRow = (i - 1) * this.rows;
			thisRow = i * this.rows;
			nextRow = (i + 1) * this.rows;

			valueBefore = thisRow - 1;
			valueNext = thisRow + 1;

			to = this.resolution + valueNext;
			for (k = valueNext; k < to; k++) {
				p[k] = 0;
				valueNext++;
				valueBefore++;
				nextRow++;
				prevRow++;
				div[k] = (u[valueNext] - u[valueBefore] + v[nextRow] - v[prevRow]) * -0.5 / this.resolution * (1 + this.gridmodify);
			}
		}

		// for (i = 1; i <= this.resolution; i++) {
		// 	for (k = 0; k < this.resolution; k++){
		// 		p[k + i * this.rows + 1] = 0;
		// 		div[k + i * this.rows + 1] = (u[i * this.rows + 1 + k] - u[i * this.rows + k] + v[(i + 1) * this.rows + k + 1] - v[(i - 1) * this.rows + k + 1]) * -0.5 / this.resolution * (1 + this.gridmodify);
		// 	}
		// }

		this.set_bnd(0, div);
		this.set_bnd(0, p);

		for (k = 0; k < this.iterations; k++) {
			for (j = 1; j <= this.resolution; j++) {
				lastRow = (j - 1) * this.rows;
				thisRow = j * this.rows;
				nextRow = (j + 1) * this.rows;
				prevX = p[thisRow];
				thisRow++;
				for (i = 1; i <= this.resolution; i++) {
					lastRow++;
					thisRow++;
					nextRow++;
					p[thisRow - 1] = prevX = (div[thisRow - 1] + p[lastRow] + p[thisRow] + p[nextRow] + prevX) * this.fract;
				}
			}
			this.set_bnd(0, p);
		}

		for (j = 1; j <= this.resolution; j++) {
			lastRow = (j - 1) * this.rows;
			thisRow = j * this.rows;
			nextRow = (j + 1) * this.rows;

			valueBefore = thisRow - 1;
			valueNext = thisRow + 1;

			for (i = 1; i <= this.resolution; i++) {
				thisRow++;
				valueNext++;
				valueBefore++;
				nextRow++;
				lastRow++;
				u[thisRow] -= this.resolution * 0.5 * (p[valueNext] - p[valueBefore]);
				v[thisRow] -= this.resolution * 0.5 * (p[nextRow] - p[lastRow]);
			}
		}
		this.set_bnd(1, u);
		this.set_bnd(2, v);
	}

	advect(b, d, d0, u, v) {
		for (var j = 1; j <= this.resolution; j++) {
			var pos = j * this.rows;
			for (var k = 1; k <= this.resolution; k++) {
				pos++;
				var x = Math.min(this.resolution + 0.5, Math.max(0.5, k - this.dt * this.resolution * u[pos]));
				var y = Math.min(this.resolution + 0.5, Math.max(0.5, j - this.dt * this.resolution * v[pos]));
				var i0 = x | 0;
				var i1 = i0 + 1;
				var j0 = y | 0;
				var s1 = x - i0;
				var t1 = y - j0;
				var t0 = 1 - t1;
				var toR1 = j0 * this.rows;
				var toR2 = (j0 + 1) * this.rows;
				d[pos] = (1 - s1) * (t0 * d0[i0 + toR1] + t1 * d0[i0 + toR2]) + s1 * (t0 * d0[i1 + toR1] + t1 * d0[i1 + toR2]);
			}
		}
		this.set_bnd(b, d);
	}
	// Calculate Boundary's
	set_bnd(b, x) {
		var i;
		switch (b) {
		case 1:
			for (i = 1; i <= this.resolution; i++) {
				x[i] = x[i + this.rows];
				x[i + (this.resolution + 1) * this.rows] = x[i + this.resolution * this.rows];
				x[0 + i * this.rows] = -x[1 + i * this.rows];
				x[this.resolution + 1 + i * this.rows] = -x[this.resolution + i * this.rows];
			}
			break;
		case 2:
			for (i = 1; i <= this.resolution; i++) {
				x[i] = -x[i + this.rows];
				x[i + (this.resolution + 1) * this.rows] = -x[i + this.resolution * this.rows];
				x[0 + i * this.rows] = x[1 + i * this.rows];
				x[this.resolution + 1 + i * this.rows] = x[this.resolution + i * this.rows];
			}
			break;
		default:
			for (i = 1; i <= this.resolution; i++) {
				x[i] = x[i + this.rows];
				x[i + (this.resolution + 1) * this.rows] = x[i + this.resolution * this.rows];
				x[0 + i * this.rows] = x[1 + i * this.rows];
				x[this.resolution + 1 + i * this.rows] = x[this.resolution + i * this.rows];
			}
		}
		// Boundes of the Canvas
		var topPos = 0 + (this.resolution + 1) * this.rows;
		x[0] = (x[1] + x[this.rows]) / 2;
		x[topPos] = (x[1 + topPos] + x[this.resolution + 0 * this.rows]) / 2;
		x[this.resolution + 1] = (x[this.resolution] + x[this.resolution + 1 + this.rows]) / 2;
		x[this.resolution + 1 + topPos] = (x[this.resolution + topPos] + x[this.resolution + 1 + this.resolution * this.rows]);

	}

}

module.exports = NavierStokes;

// this\.IX\[([^\]]+)\]\[([^\]]+)\]
