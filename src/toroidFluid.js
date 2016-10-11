class Fluid {
	constructor(params){
		this.params = params;
		this.reset();
	}

	reset(){
		var {rows} = this.params;

		var len = rows * rows;
		this.xs = new Float32Array(len);
		this.ys = new Float32Array(len);
		this.pr = new Float32Array(len);
		this.dn = new Float32Array(len);

		this.temps = [
			new Float32Array(len),
			new Float32Array(len),
			new Float32Array(len)
		];

		this.up = new Uint16Array(len);
		this.dw = new Uint16Array(len);
		this.lt = new Uint16Array(len);
		this.rt = new Uint16Array(len);
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
		this.calculatePressures();
		this.calculateVelocities();
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
		var {iterations} = this.params;
		var {xs, ys, pr, temps, up, dw, lt, rt} = this;
		var k, i, pv = temps[0], p0 = temps[1];

		for (i = 0; i < xs.length; i++){
			pr[i] = pv[i] = xs[lt[i]] - xs[rt[i]] + ys[up[i]] - ys[dw[i]];
		}

		for (k = 0; k < iterations; k++){
			for (i = 0; i < pr.length; i++){
				p0[i] = (pv[i] + pr[lt[i]] + pr[rt[i]] + pr[up[i]] + pr[dw[i]]) / 4;
			}
			for (i = 0; i < pr.length; i++){
				pr[i] = (pv[i] + p0[lt[i]] + p0[rt[i]] + p0[up[i]] + p0[dw[i]]) / 4;
			}
		}

	}

	calculateVelocities(){
		var {xs, ys, pr, up, dw, lt, rt} = this;
		for (var i = 0; i < xs.length; i++){
			xs[i] += (pr[lt[i]] - pr[rt[i]]) / 2;
			ys[i] += (pr[up[i]] - pr[dw[i]]) / 2;
		}
	}

	// moveBodies(xc, yc, px, py){
	// 	var {rows, speed} = this.params;
	// 	var {xs, ys, dw, rt} = this;
	//
	// 	for (var i = 0; i < xc.length; i++){
	// 		px[i] = xc[i];
	// 		py[i] = yc[i];
	//
	// 		var x0 = Math.floor(xc[i]);
	// 		var y0 = Math.floor(yc[i]);
	// 		var distFromLt = speed * (xc[i] - x0);
	// 		var distFromRt = speed - distFromLt;
	// 		var distFromUp = yc[i] - y0;
	// 		var distFromDw = 1 - distFromUp;
	// 		var t = ((y0 + 1e6 * rows) % rows) * rows + (x0 + 1e6 * rows) % rows;
	//
	// 		xc[i] += distFromRt * (distFromDw * xs[t] + distFromUp * xs[dw[t]]) + distFromLt * (distFromDw * xs[rt[t]] + distFromUp * xs[dw[rt[t]]]);
	// 		yc[i] += distFromRt * (distFromDw * ys[t] + distFromUp * ys[dw[t]]) + distFromLt * (distFromDw * ys[rt[t]] + distFromUp * ys[dw[rt[t]]]);
	//
	// 		if (xc[i] < 0 || xc[i] >= rows || yc[i] < 0 || yc[i] >= rows){
	// 			xc[i] = px[i] = (xc[i] + rows) % rows;
	// 			yc[i] = py[i] = (yc[i] + rows) % rows;
	// 		}
	// 	}
	// }

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
		var {rows, pushStrength, pushAmount, speed} = this.params;

		dx *= rows;
		dy *= rows;

		var len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
		var amt = pushStrength * len / rows / speed;

		for (var i = 0; i < len; i++) {
			var x = Math.floor(rows * x1 + i / len * dx);
			var y = Math.floor(rows * y1 + i / len * dy);
			var n = x + y * rows;
			this.xs[n] = dx * amt;
			this.ys[n] = dy * amt;
			this.dn[n] = pushAmount / rows;
		}
	}
}

module.exports = Fluid;
