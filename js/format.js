//Fix of this

var format  = function() {
	var args = Array.prototype.slice.call(arguments,0);
	var fmt = (typeof(args[0])==='string'? args[0]:'');
	var length = args.length;
	for(var i=1;i<length;++i){
	  var pattern = new RegExp('\\{'+(i-1)+'\\}', 'g');
		fmt = fmt.replace(pattern, args[i]);
	}
	return fmt;
};

var formatKey = function(fmt, dc){
	fmt = (typeof(fmt)=='string' ? fmt : '');
	for(var k in dc){
		var pattern = new RegExp('\\$\\{' + k + '\\}', 'g');
		fmt = fmt.replace(pattern, dc[k]);
	}
	return fmt;
};

module.exports = {
		format:format,
		formatKey:formatKey
};




