class ParticleSystem {
	constructor(params){
		this.params = params;
		this.num = 5000;
		this.xc = new Float32Array(this.num);
		this.yc = new Float32Array(this.num);
		this.px = new Float32Array(this.num);
		this.py = new Float32Array(this.num);
	}
	reset(){
		var {rows} = this.params;
		for (var i = 0; i < this.num; i++){
			this.xc[i] = this.px[i] = Math.random() * rows;
			this.yc[i] = this.py[i] = Math.random() * rows;
			// var d = i / this.num;
			// var a = d * 20 * Math.PI;
			// this.xc[i] = this.px[i] = rows / 2 * (1 + d * Math.sin(a));
			// this.yc[i] = this.py[i] = rows / 2 * (1 + d * Math.cos(a));
		}
	}
	iterate(fluid){
		var {rows, speed} = this.params;
		var {xc, yc, px, py, num} = this;

		for (var i = 0; i < num; i++){
			var n = rows * Math.floor(yc[i]) + Math.floor(xc[i]);
			px[i] = xc[i];
			py[i] = yc[i];
			xc[i] += fluid.xs[n] * speed;
			yc[i] += fluid.ys[n] * speed;

			if (xc[i] < 0 || xc[i] >= rows || yc[i] < 0 || yc[i] >= rows){
				xc[i] = px[i] = (xc[i] + rows) % rows;
				yc[i] = py[i] = (yc[i] + rows) % rows;
			}
		}
	}
}

module.exports = ParticleSystem;
