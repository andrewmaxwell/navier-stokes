class Display {
	constructor(params){
		this.bottomCanvas = document.createElement('canvas');
		document.body.appendChild(this.bottomCanvas);

		this.topCanvas = document.createElement('canvas');
		this.topCanvas.style.position = 'absolute';
		this.topCanvas.style.top = this.topCanvas.style.left = 0;

		document.body.appendChild(this.topCanvas);

		window.onresize = () => this.resize();
		this.resize();

		this.colorCtx = this.bottomCanvas.getContext('2d', {alpha: false});

		this.params = params;
	}
	resize(){
		this.width = this.topCanvas.width = this.topCanvas.height = Math.min(window.innerWidth, window.innerHeight);
		this.bottomCanvas.style.width = this.bottomCanvas.style.height = this.width + 'px';
	}
	render(fluid){
		var {rows, red, green, blue} = this.params;
		var {colorCtx, bottomCanvas} = this;

		if (this.size != rows){
			this.size = bottomCanvas.width = bottomCanvas.height = rows;
			this.imageData = colorCtx.createImageData(this.size, this.size);
		}

		var d = this.imageData.data;
		for (var x = 0; x < rows; x++){
			for (var y = 0; y < rows; y++){
				var pos = x + y * rows;
				var posC = (x + y * rows) * 4;
				d[posC + 0] = Math.abs(fluid.x0[pos] * red) | 0;
				d[posC + 1] = (fluid.d0[pos] * green) | 0;
				d[posC + 2] = Math.abs(fluid.y0[pos] * blue) | 0;
				d[posC + 3] = 255;
			}
		}
		colorCtx.putImageData(this.imageData, 0, 0);
	}
}

module.exports = Display;
