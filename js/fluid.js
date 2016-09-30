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

		this.cp = new Float32Array(n);

		var ix = [];
		for (var i = 1; i < rows - 1; i++){
			for (var k = 1; k < rows - 1; k++){
				ix.push(i * rows + k);
			}
		}
		this.ix = Float32Array.from(ix);
	}

	iterate(){
		this.diffuse();
		this.calculatePressures();
		this.calculateVelocities();
		this.advect();
	}

	diffuse(){
		var {rows, diffusion} = this.params;
		var {dn} = this;
		for (var i = 0; i < rows * rows; i++){
			// xs[i] *= diffusion;
			// ys[i] *= diffusion;
			dn[i] *= diffusion;
		}
	}

	calculatePressures(){
		var {rows, iterations} = this.params;
		var {ix, temps, cp, xs, ys} = this;

		var pv = temps[0];

		// pressures from velocities
		var mult = 0.5 / rows;
		for (var i = 0; i < ix.length; i++){
			var n = ix[i];
			pv[n] = (xs[n - 1] - xs[n + 1] + ys[n - rows] - ys[n + rows]) * mult;
		}

		cp.fill(0); // cummulative pressure
		for (var k = 0; k < iterations; k++){

			// (sum of each cells' pv and its neighbors' cp) / 4, store in cp
			for (var i = 0; i < ix.length; i++){
				var n = ix[i];
				cp[n] = (pv[n] + cp[n - 1] + cp[n + 1] + cp[n - rows] + cp[n + rows]) / 4;
			}
			this.setEdges(cp, 1, 1);

		}
	}

	calculateVelocities(){
		var {rows} = this.params;
		var {ix, xs, ys, cp} = this;

		var mult = rows / 2;
		for (var i = 0; i < ix.length; i++){
			var n = ix[i];
			xs[n] += mult * (cp[n - 1] - cp[n + 1]);
			ys[n] += mult * (cp[n - rows] - cp[n + rows]);
		}

		this.setEdges(xs, 1, -1);
		this.setEdges(ys, -1, 1);
	}

	advect(){

		var {rows, speed} = this.params;
		var {xs, ys, dn, temps} = this;

		var arrs = [xs, ys, dn];

		for (var j = 0; j < rows; j++){
			for (var k = 0; k < rows; k++){
				var n = j * rows + k;

				var x = Math.min(rows - 1.5, Math.max(0.5, k - speed * (rows - 2) * xs[n]));
				var ltCol = x | 0;
				var rtCol = ltCol + 1;
				var distFromLeft = x - ltCol;

				var y = Math.min(rows - 1.5, Math.max(0.5, j - speed * (rows - 2) * ys[n]));
				var yUp = y | 0;
				var distFromAbove = y - yUp;
				var upRow = yUp * rows;
				var dnRow = upRow + rows;

				for (var i = 0; i < arrs.length; i++){

					var arr = arrs[i];
					var temp = temps[i];

					temp[n] =
						distFromLeft * (
							distFromAbove 			* arr[rtCol + dnRow] +
							(1 - distFromAbove) * arr[rtCol + upRow]
						) +
						(1 - distFromLeft) * (
							distFromAbove 			* arr[ltCol + dnRow] +
							(1 - distFromAbove) * arr[ltCol + upRow]
						);
				}
			}
		}

		[this.xs, this.temps[0]] = [temps[0], xs];
		[this.ys, this.temps[1]] = [temps[1], ys];
		[this.dn, this.temps[2]] = [temps[2], dn];

		this.setEdges(xs, 1, -1);
		this.setEdges(ys, -1, 1);
		this.setEdges(dn, 1, 1);
	}

	setEdges(a, horizMult, vertiMult){
		var rows = this.params.rows;
		var bottom = rows * (rows - 1);
		for (var i = 1; i < rows - 1; i++){
			a[i] 									= horizMult * a[rows + i];
			a[bottom + i] 				= horizMult * a[bottom - rows + i];
			a[rows * i] 					= vertiMult * a[rows * i + 1];
			a[rows * i + rows - 1]	= vertiMult * a[rows * i + rows - 2];
		}

		a[0] = (a[1] + a[rows]) / 2;
		a[bottom] = (a[1 + bottom] + a[(rows - 2) + 0 * rows]) / 2;
		a[rows - 1] = (a[(rows - 2)] + a[rows - 1 + rows]) / 2;
		a[rows - 1 + bottom] = (a[(rows - 2) + bottom] + a[rows - 1 + (rows - 2) * rows]) / 2;
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
			this.xs[n] = dx * pushStrength;
			this.ys[n] = dy * pushStrength;
			this.dn[n] = pushAmount;
		}

		this.setEdges(this.xs, 1, -1);
		this.setEdges(this.ys, -1, 1);
		this.setEdges(this.dn, 1, 1);
	}
}

module.exports = Fluid;
