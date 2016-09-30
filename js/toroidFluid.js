class Fluid {
	constructor(params){
		this.params = params;
		this.reset();
	}

	reset(){
		var {rows} = this.params;

		var n = rows * rows;
		this.xs = new Float32Array(n);
		this.ys = new Float32Array(n);
		this.dn = new Float32Array(n);

		this.temps = [
			new Float32Array(n),
			new Float32Array(n),
			new Float32Array(n)
		];

		this.up = new Uint16Array(n);
		this.dw = new Uint16Array(n);
		this.lt = new Uint16Array(n);
		this.rt = new Uint16Array(n);
		for (var i = 0; i < rows; i++){
			for (var j = 0; j < rows; j++){
				var n = i * rows + j;
				this.up[n] = rows * ((i - 1 + rows) % rows) + j;
				this.dw[n] = rows * ((i + 1) % rows) + j;
				this.lt[n] = rows * i + ((j - 1 + rows) % rows);
				this.rt[n] = rows * i + ((j + 1) % rows);
			}
		}
	}

	iterate(){
		this.diffuse();
		var p1 = this.calculatePressures();
		var p2 = this.calculateCummulativePressures(p1);
		this.calculateVelocities(p2);
		this.advect();
	}

	diffuse(){
		var {diffusion} = this.params;
		var {xs, ys, dn} = this;
		for (var i = 0; i < dn.length; i++){
			xs[i] *= diffusion;
			ys[i] *= diffusion;
			dn[i] *= diffusion;
		}
	}

	calculatePressures(){
		var {temps, xs, ys, up, dw, lt, rt} = this;

		var pv = temps[0];

		// pressures from velocities
		for (var i = 0; i < xs.length; i++){
			pv[i] = xs[lt[i]] - xs[rt[i]] + ys[up[i]] - ys[dw[i]];
		}

		return pv;
	}

	calculateCummulativePressures(initialPressures){
		var {iterations} = this.params;
		var {temps, up, dw, lt, rt} = this;

		var k, i, t, cp = temps[1], cp_temp = temps[2];

		cp.fill(0); // cummulative pressure

		for (k = 0; k < iterations; k++){

			// (sum of each cells' initialPressure and its neighbors' cp) / 4, store in cp
			for (i = 0; i < cp.length; i++){
				cp_temp[i] = (initialPressures[i] + cp[lt[i]] + cp[rt[i]] + cp[up[i]] + cp[dw[i]]) / 4;
			}

			t = cp;
			cp = cp_temp;
			cp_temp = t;
		}

		return cp;
	}

	calculateVelocities(pressure){
		var {xs, ys, up, dw, lt, rt} = this;
		for (var i = 0; i < xs.length; i++){
			xs[i] += (pressure[lt[i]] - pressure[rt[i]]) / 2;
			ys[i] += (pressure[up[i]] - pressure[dw[i]]) / 2;
		}
	}

	advect(){

		var {rows, speed} = this.params;
		var {xs, ys, dn, temps, rt, dw} = this;

		var arrs = [xs, ys, dn];

		for (var j = 0; j < rows; j++){
			for (var k = 0; k < rows; k++){
				var n = j * rows + k;

				var x = k - speed * xs[n];
				var y = j - speed * ys[n];

				var x0 = Math.floor(x);
				var y0 = Math.floor(y);

				var distFromLeft = x - x0;
				var distFromAbove = y - y0;

				var t = ((y0 + 1e6 * rows) % rows) * rows + (x0 + 1e6 * rows) % rows;

				for (var i = 0; i < arrs.length; i++){

					var arr = arrs[i];
					var temp = temps[i];

					temp[n] =
						(1 - distFromLeft) * ((1 - distFromAbove) * arr[		t] + distFromAbove * arr[dw[		t]]) +
								 distFromLeft  * ((1 - distFromAbove) * arr[rt[t]] + distFromAbove * arr[dw[rt[t]]]);
				}
			}
		}

		[this.xs, this.temps[0]] = [temps[0], xs];
		[this.ys, this.temps[1]] = [temps[1], ys];
		[this.dn, this.temps[2]] = [temps[2], dn];
	}

	interact(x1, y1, dx, dy){
		var {rows, pushStrength, pushAmount} = this.params;

		dx *= rows;
		dy *= rows;
		var len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
		for (var i = 0; i < len; i++) {
			var x = Math.floor(rows * x1 + i / len * dx);
			var y = Math.floor(rows * y1 + i / len * dy);
			var n = x + y * rows;
			this.xs[n] = dx / len * pushStrength;
			this.ys[n] = dy / len * pushStrength;
			this.dn[n] = pushAmount;
		}
	}
}

module.exports = Fluid;
