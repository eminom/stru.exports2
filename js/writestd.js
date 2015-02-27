
// February. 2o15
// 
// eminem

var format = require('./format').formatKey;

var WriteStd = function() {
	// May not be so efficient.
	this.__tabstop = 0;
	this.__stack = [];
};

WriteStd.prototype.__defineGetter__('tabstop', function(){
	return this.__tabstop;
});

WriteStd.prototype.__defineSetter__('tabstop', function(n) {
	if(typeof(n) == 'number'){
		this.__tabstop = n;
		if(this.__stack.length > 0){
			this.__stack[this.__stack.length - 1] = n;
		}
	}
});

WriteStd.prototype.out = function(){
	for(var i=0;i<this.__tabstop;++i){
		process.stdout.write(' ');
	}
	console.log.apply(null, Array.prototype.slice.call(arguments,0));
};

WriteStd.prototype.format = function(){
	this.out(format.apply(null, Array.prototype.slice.call(arguments,0)));
};


WriteStd.prototype.pushn = function(n){
	this.__stack.push(n);
	this.__tabstop = n;     //WriteStd.__stack[WriteStd.__stack.length-1];
};

WriteStd.prototype.push = function(){
	this.pushn(this.tabstop + 2);
}

WriteStd.prototype.pop = function(){
	this.__stack.pop();
	if (0==this.__stack.length) {
		this.__tabstop = 0;
		return 0;
	}
	var n = this.__stack[this.__stack.length-1];
	if(typeof(n)!='number'){
		n = 0;
	}
	this.__tabstop = n;
	return n;
};

WriteStd.prototype.scope = function(fn){
	this.push();
	fn();
	this.pop();
};

module.exports = WriteStd;



