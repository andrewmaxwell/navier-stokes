class ParticleSystem {
	constructor(params){
		this.params = params;
		this.num = 10000;
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

		for (var i = 0; i < this.num; i++){
			var n = rows * (this.yc[i] | 0) + (this.xc[i] | 0);
			this.px[i] = this.xc[i];
			this.py[i] = this.yc[i];
			this.xc[i] += fluid.xs[n] * 10;
			this.yc[i] += fluid.ys[n] * 10;

			if (this.xc[i] < 0 || this.xc[i] >= rows || this.yc[i] < 0 || this.yc[i] >= rows){
				this.xc[i] = this.px[i] = rows * Math.random();
				this.yc[i] = this.py[i] = rows * Math.random();
			}
		}
	}
}

module.exports = ParticleSystem;
