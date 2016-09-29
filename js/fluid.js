class Fluid {
	constructor(params){
		this.params = params;
		this.reset();
	}

	reset(){
		var {rows} = this.params;

		var n = rows * rows;
		this.x0 = new Float32Array(n);
		this.y0 = new Float32Array(n);
		this.d0 = new Float32Array(n);
		this.x1 = new Float32Array(n);
		this.y1 = new Float32Array(n);
		this.d1 = new Float32Array(n);

		this.pv = new Float32Array(n);
		this.cp = new Float32Array(n);

		var ix = [];
		for (var i = 1; i < rows - 1; i++){
			for (var k = 1; k < rows - 1; k++){
				ix.push(i * rows + k);
			}
		}
		this.ix = Float32Array.from(ix);
	}

	update(){
		var {rows, iterations, diffusion, speed} = this.params;
		var {x0, y0, d0, x1, y1, d1, pv, cp, ix} = this;
		var pairs = [[x0, x1], [y0, y1], [d0, d1]];

		for (var i = 0; i < rows * rows; i++){
			d1[i] = d0[i] * diffusion;
			x1[i] = x0[i] * diffusion;
			y1[i] = y0[i] * diffusion;
		}

		var mult = 0.5 / rows;
		for (var i = 0; i < ix.length; i++){
			var n = ix[i];
			pv[n] = (x1[n - 1] - x1[n + 1] + y1[n - rows] - y1[n + rows]) * mult;
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

		// add to velocity of each cell
		var mult = rows / 2;
		for (var i = 0; i < ix.length; i++){
			var n = ix[i];
			x1[n] += mult * (cp[n - 1] - cp[n + 1]);
			y1[n] += mult * (cp[n - rows] - cp[n + rows]);
		}

		this.setEdges(x1, 1, -1);
		this.setEdges(y1, -1, 1);

		// ADVECT
		for (var j = 1; j < rows - 1; j++){
			for (var k = 1; k < rows - 1; k++){
				var n = j * rows + k;

				var x = Math.min(rows - 1.5, Math.max(0.5, k - speed * (rows - 2) * x1[n]));
				var ltCol = x | 0;
				var rtCol = ltCol + 1;
				var distFromLeft = x - ltCol;

				var y = Math.min(rows - 1.5, Math.max(0.5, j - speed * (rows - 2) * y1[n]));
				var yUp = y | 0;
				var distFromAbove = y - yUp;
				var upRow = yUp * rows;
				var dnRow = upRow + rows;

				for (var i = 0; i < pairs.length; i++){
					var a = pairs[i][0];
					var a0 = pairs[i][1];
					a[n] =
						distFromLeft * (
							distFromAbove 			* a0[rtCol + dnRow] +
							(1 - distFromAbove) * a0[rtCol + upRow]
						) +
						(1 - distFromLeft) * (
							distFromAbove 			* a0[ltCol + dnRow] +
							(1 - distFromAbove) * a0[ltCol + upRow]
						);
				}
			}
		}

		this.setEdges(x0, 1, -1);
		this.setEdges(y0, -1, 1);
		this.setEdges(d0, 1, 1);

		d1.fill(0);
		x1.fill(0);
		y1.fill(0);
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

	interact(x1, y1, x2, y2){
		var {rows, pushStrength, pushAmount} = this.params;

		var dx = (x1 - x2) * rows;
		var dy = (y1 - y2) * rows;
		var len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
		for (var i = 0; i < len; i++) {
			var x = Math.floor(rows * x1 + i / len * dx);
			var y = Math.floor(rows * y1 + i / len * dy);
			var n = x + y * rows;
			this.x0[n] = dx * pushStrength;
			this.y0[n] = dy * pushStrength;
			this.d0[n] = pushAmount;
		}

		this.setEdges(this.x0, 1, -1);
		this.setEdges(this.y0, -1, 1);
		this.setEdges(this.d0, 1, 1);
	}
}

module.exports = Fluid;
