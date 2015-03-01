


// February 2o15. 2o15
// Coded by eminom
// 

// Protocols:
// Macro string: _${stru.origin}MetaString
// Prefix: es_${method.call}
// Registry: ${stru.origin}TmpIndex
// Method imples name : ${Prefix}_${method.call}
// The loading:  load${stru.origin}TmpIndex

var fs = require('fs');
var assert = require('assert');
var format = require('./format').formatKey;
var typeIn = require('./typecaster').in;
var ContentProcessor = require('./processContent');
var WriteStd = require('./writestd');
var DbgOutput = console.error;

(function(){
	assert(format);
	// DbgOutput('Before define');
	String.prototype.startsWith = function(prefix){
		var length = prefix.length;
		return this.length >= length && (this.substr(0, length) == prefix);
	};
	String.prototype.endsWith = function(suffix){
		var length = suffix.length;
		return this.length >= length && this.substr(this.length - length) == suffix;
	}

	//Test 
	assert(  'hello, world'.startsWith('he'),  'Test');
	assert( !'hello'.startsWith('hello, world'), 'Test');
	assert(  'hello, world'.endsWith(' world'), 'Test');
	assert( !'hello'.endsWith('100hello'), 'Test');
	assert( !'hello'.endsWith(100), 'Test');
	// DbgOutput('after define');
	// DbgOutput(String.prototype.startsWith);
})();

function loadTemplate(path){
	var content = fs.readFileSync(path,{encoding:'utf8'});
	return content;
}

function makepath(path){
	if(!path.startsWith('./')){
		path = './' + path;
	}
	return path;
}

function main(){
	var filepath = process.argv[2];
	if (!filepath){
		DbgOutput('No input');
		return;
	}
	var chunk = JSON.parse(loadTemplate(filepath));

	var content = chunk['content'];
	if(content){
		var cp = new ContentProcessor(new WriteStd());
		cp.processContent(content);
	}
}

// Do it.
main();

