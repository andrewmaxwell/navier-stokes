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

		this.project();

		this.advect(this.U, this.U_prev);
		this.set_bnd(1, this.U);

		this.advect(this.V, this.V_prev);
		this.set_bnd(2, this.V);

		this.swap('U', 'U_prev');
		this.swap('V', 'V_prev');

		this.project();
		this.advect(this.D, this.D_prev);
		this.set_bnd(0, this.D);

		this.callbackDisplay(this.D_prev, this.U_prev, this.V_prev, this.resolution);

		this.swap('U', 'U_prev');
		this.swap('V', 'V_prev');
	}

	swap(prop1, prop2){
		var t = this[prop1];
		this[prop1] = this[prop2];
		this[prop2] = t;
	}

	project() {
		var u0 = this.U_prev;
		var v0 = this.V_prev;
		var u = this.U;
		var v = this.V;
		var rows = this.rows;

		var mult = (1 + this.gridmodify) / 2 / this.resolution;
		for (var i = 1; i < rows - 1; i++){
			for (var k = 1; k < rows - 1; k++){
				var x = i * rows + k;
				u[x] = 0;
				v[x] = mult * (u0[x - 1] - u0[x + 1] + v0[x - rows] - v0[x + rows]);
			}
		}

		this.set_bnd(0, v);
		this.set_bnd(0, u);

		for (var k = 0; k < this.iterations; k++){
			for (var j = 1; j < rows - 1; j++) {
				for (var i = 1; i < rows - 1; i++){
					var x = j * rows + i;
					u[x] = this.fract * (v[x] + u[x - rows] + u[x + 1] + u[x + rows] + u[x - 1]);
				}
			}
			this.set_bnd(0, u);
		}

		var mult = this.resolution / 2;
		for (var j = 1; j < rows - 1; j++) {
			for (var i = 1; i < rows - 1; i++) {
				var x = j * rows + i;
				u0[x] += mult * (u[x - 1] - u[x + 1]);
				v0[x] += mult * (u[x - rows] - u[x + rows]);
			}
		}

		this.set_bnd(1, u0);
		this.set_bnd(2, v0);
	}

	advect(d, d0) {
		for (var j = 1; j < this.rows - 1; j++) {
			for (var k = 1; k < this.rows - 1; k++) {
				var dex = j * this.rows + k;
				var x = Math.min(this.resolution + 0.5, Math.max(0.5, k - this.dt * this.resolution * this.U_prev[dex]));
				var y = Math.min(this.resolution + 0.5, Math.max(0.5, j - this.dt * this.resolution * this.V_prev[dex]));
				var x0 = x | 0;
				var x1 = x0 + 1;
				var s1 = x - x0;
				var y0 = y | 0;
				var t1 = y - y0;
				var toR1 = y0 * this.rows;
				var toR2 = toR1 + this.rows;
				d[dex] =
					(1 - s1) * ((1 - t1) * d0[x0 + toR1] + t1 * d0[x0 + toR2]) +
					(0 + s1) * ((1 - t1) * d0[x1 + toR1] + t1 * d0[x1 + toR2]);
			}
		}
	}

	set_bnd(b, x) {
		var rows = this.rows;

		var negateH = b == 2 ? -1 : 1;
		var negateV = b == 1 ? -1 : 1;
		for (var i = 1; i < rows - 1; i++) {
			x[i] 											= negateH * x[i + rows];
			x[i + rows * (rows - 1)] 	= negateH * x[i + (rows - 2) * rows];
			x[i * rows] 							= negateV * x[1 + i * rows];
			x[(i + 1) * rows - 1] 		= negateV * x[rows - 2 + i * rows];
		}

		var topPos = (rows - 1) * rows;
		x[0] = (x[1] + x[rows]) / 2;
		x[topPos] = (x[1 + topPos] + x[(rows - 2) + 0 * rows]) / 2;
		x[rows - 1] = (x[(rows - 2)] + x[rows - 1 + rows]) / 2;
		x[rows - 1 + topPos] = (x[(rows - 2) + topPos] + x[rows - 1 + (rows - 2) * rows]);
	}

}

module.exports = NavierStokes;
