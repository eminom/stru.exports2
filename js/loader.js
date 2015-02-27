
var fs = require('fs');

//Make this one local
var buffConcat = function(buf0, buf1, size0, size1)
{
	//Buffer of length 0 is valid !
	var buffer = new Buffer(size0 + size1);
	buf0.copy(buffer, 0, 0, size0);
	buf1.copy(buffer, size0, 0, size1);
	return buffer;
}

function _loadFromStream(){
	var fd = fs.openSync('/dev/stdin', 'rs');
	var buf = new Buffer(0);
	var totSize = 0;
	while(true)	{
		var subsize = 8;      // This should be larger.(1 for test)
		var buffer = new Buffer(subsize);
		var bytesRead = fs.readSync(fd, buffer, 0, subsize);
		if(bytesRead<=0){
			break;
		}
		buf = buffConcat(buf, buffer, totSize, bytesRead);
		totSize += bytesRead;
	}
	fs.closeSync(fd);
	return buf.toString('utf8',0, totSize);
}

module.exports = _loadFromStream;
