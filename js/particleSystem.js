class ParticleSystem {
	constructor(params){
		this.params = params;
		this.num = 5000;
		this.xc = new Float32Array(this.num);
		this.yc = new Float32Array(this.num);
		this.px = new Float32Array(this.num);
		this.py = new Float32Array(this.num);
		for (var i = 0; i < this.num; i++){
			this.xc[i] = this.px[i] = Math.random() * params.rows;
			this.yc[i] = this.py[i] = Math.random() * params.rows;
		}
	}
	iterate(fluid){
		var {rows} = this.params;
		var {xc, yc, px, py, num} = this;

		for (var i = 0; i < num; i++){
			var n = rows * (yc[i] | 0) + (xc[i] | 0);
			px[i] = xc[i];
			py[i] = yc[i];
			xc[i] += fluid.xs[n] * 10;
			yc[i] += fluid.ys[n] * 10;

			if (xc[i] < 0 || xc[i] >= rows || yc[i] < 0 || yc[i] >= rows){
				xc[i] = px[i] = (xc[i] + rows) % rows;
				yc[i] = py[i] = (yc[i] + rows) % rows;
			}
		}
	}
}

module.exports = ParticleSystem;
