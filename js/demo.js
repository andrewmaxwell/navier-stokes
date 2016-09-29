class Demo {
	constructor(opts){
		var paused = false;

		function _loop(){
			opts.loop();
			if (!paused) requestAnimationFrame(_loop);
		};

		window.ondblclick = () => opts.reset();
		window.onblur = () => paused = true;
		window.onfocus = () => {
			if (paused){
				paused = false;
				_loop();
			}
		};

		opts.reset();
		_loop();
	}
}

module.exports = Demo;
