class Display {
	constructor(params){
		this.params = params;

		this.bottomCanvas = document.createElement('canvas');
		this.bottomCtx = this.bottomCanvas.getContext('2d', {alpha: false});
		document.body.appendChild(this.bottomCanvas);

		this.topCanvas = document.createElement('canvas');
		this.topCanvas.style.position = 'absolute';
		this.topCanvas.style.top = this.topCanvas.style.left = 0;
		this.topCtx = this.topCanvas.getContext('2d');
		document.body.appendChild(this.topCanvas);

		window.onresize = () => this.resize();
		this.resize();
	}
	resize(){
		this.width = this.topCanvas.width = this.topCanvas.height = Math.min(window.innerWidth, window.innerHeight);
		this.bottomCanvas.style.width = this.bottomCanvas.style.height = this.width + 'px';
	}
	renderFluid(fluid){
		var {rows} = this.params;
		var {bottomCtx, bottomCanvas} = this;

		if (this.rows != rows){
			this.rows = bottomCanvas.width = bottomCanvas.height = rows;
			this.imageData = bottomCtx.createImageData(this.rows, this.rows);
			for (var i = 3; i < this.imageData.data.length; i += 4){
				this.imageData.data[i] = 255;
			}
		}

		var d = this.imageData.data;
		for (var i = 0; i < fluid.ix.length; i++){
			var n = fluid.ix[i];
			var k = n * 4;

			// d[k + 0] = Math.abs(fluid.xs[n] * this.params.red) | 0;
			// d[k + 1] = (fluid.dn[n] * this.params.green) | 0;
			// d[k + 2] = Math.abs(fluid.ys[n] * this.params.blue) | 0;

			var pressure = (fluid.cp[n] * 100000) | 0;
			d[k + 0] = Math.max(0, pressure);
			d[k + 1] = (fluid.dn[n] * this.params.green) | 0;
			d[k + 2] = Math.max(0, -pressure);
		}
		bottomCtx.putImageData(this.imageData, 0, 0);

		// var T = this.topCtx;
		// var scale = this.width / rows;
		// T.clearRect(0, 0, this.width, this.width);
		// T.strokeStyle = 'green';
		// T.save();
		// T.scale(scale, scale);
		// T.beginPath();
		// for (var i = 0; i < rows; i++){
		// 	for (var j = 0; j < rows; j++){
		// 		var n = i * rows + j;
		// 		T.moveTo(j, i);
		// 		T.lineTo(j + fluid.xs[n], i + fluid.ys[n]);
		// 	}
		// }
		// T.stroke();
		// T.restore();
	}
	renderParticles(particles){
		var T = this.topCtx;
		var scale = this.width / this.params.rows;
		T.clearRect(0, 0, this.width, this.width);
		T.strokeStyle = 'white';
		T.save();
		T.scale(scale, scale);
		T.lineWidth = 1 / scale;
		T.beginPath();

		var {num, xc, yc, px, py} = particles;
		for (var i = 0; i < num; i++){
			T.moveTo(xc[i], yc[i]);
			T.lineTo(px[i], py[i]);
		}
		T.stroke();
		T.restore();
	}
}

module.exports = Display;
