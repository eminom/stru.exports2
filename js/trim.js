module.exports = function(s, t){
	while(s.substring(s.length-1) == t){
	  s = s.substring(0, s.length-1);
	}
	return s;
};

