
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
var writestd = new (require('./writestd'))();
var DbgOutput = console.error;

var SCOPE = 'es';

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

function processMethodImpl(method, exporting, wrapper){
	var msg = format(loadTemplate('tmpl/body.tmpl'),{
			ExportingClass:exporting,
			Name:method.call,
			ParamCount:method.params.length + 1
	});
	writestd.out(msg);
	writestd.scope(
		function(){
			var params = method.params;
			var count = params.length;
			var line;

			//The first one is wrapper for sure.
			writestd.format("${Type}* p1 = checkUserData<${Type}>(L, 1);", {
				Type:wrapper
			});
			for(var i=0;i<count;++i){
				var index = i + 2;
				var one = params[i];
				if(one.isClass){
					line = format("${Type}Wrapper* p${Index} = checkUserData<${Type}Wrapper>(L, ${Index});",
						{Type:one.type, Index:index}
					);
				} else {
					line = format("${Type} p${Index} = ${ComplexInput};",
						{Type:one.type, Index:index,
						ComplexInput:typeIn[one.type](index)
						}
					);
				}
				writestd.out(line);
			}
			//The calling
			var call = format("p1->${Name}(",
				{Name:method.call}
			);
			for(var i=0;i<count;++i){
				var index = i + 2;
				call += (i>0?',':'') + 'p' + index;
			}
			call += ');';
			writestd.out(call);
			writestd.out('return 0;');
		}
	);
	writestd.out('}\n');
}

function processMethod(method){
	var opt = {
		ReturnType: method.return,
		MethodName: method.call,
	};
	var out = format("${ReturnType} ${MethodName}(", opt);
	var params = method.params;
	var pre = false;
	for(var i=0;i<params.length;++i){
		var param = params[i];
		var index = i + 1;

		var type = param.type;
		if(param.isClass){
			type += 'Wrapper*';
		}

		var one = format("${Type} ${Name}",
			{Type:type,
			 Name:'p' + index
			}
		);
		if(pre){
			out += ',';
		}
		pre = true;
		out += one;
	}
	out += ')';
	writestd.out(out);
	writestd.out('{');
	//var w = writestd.out;
	writestd.scope(
		function(){
			var msg = format('_ref->${MethodName}(', opt);
			for(var i=0;i<params.length;++i){
				var p = params[i].isClass ? 'p'+(i+1)+'->_ref' : 'p' +(i+1);
				msg += (i?',':'') + p;
			}
			msg += ');';
			writestd.out(msg);
		}
	);
	writestd.out('}');
}

function processStru(stru){
	// DbgOutput('Process stru ********************');
	//writestd.out(JSON.stringify(stru));
	var options = {
		TimeString:new Date(),
		ExportingClass:stru.origin,
		WrapperClass:stru.name,		//~name is good enough
		MetaName:stru.meta,
	};

	//Head
	writestd.format(loadTemplate('tmpl/head.tmpl'), options);

	//Structure
	writestd.format('struct ${WrapperClass} {\n', options);

	//Members(Method, fields)
	writestd.push();

	//Instance Methods
	var methods = stru.methods;
	assert(Array.isArray(methods), "must be method");
	var methodCount = methods.length;
	for(var i=0;i<methodCount;++i){
		processMethod(methods[i]);
	}

	//Fields
	writestd.format("${ExportingClass}* _ref;", options);
	writestd.format("static const char* MetaName;");

	writestd.pop();
	writestd.out('};');

	writestd.out('');
	writestd.out('');
	writestd.format("const char* ${WrapperClass}::MetaName = _${ExportingClass}MetaString;", options);
	writestd.out('');

	for(var i=0;i<methods.length;++i){
		processMethodImpl(methods[i], options.ExportingClass, options.WrapperClass); 
	}

	// the registry
	writestd.format("static luaL_Reg ${Name}TmpIndex[] = {", {
		Name:stru.origin,
	});
	writestd.scope(
		function(){
			for(var i=0;i<methods.length;++i){
				writestd.format("{\"${Name}\", ${ExportingClass}_${Name}},", {
					ExportingClass:options.ExportingClass,
					Name:methods[i].call
				});
			}
			writestd.out("{NULL, NULL}");
		}
	);
	writestd.out('};');

	//The loader
	var tailFmt = loadTemplate('tmpl/tail.tmpl');
	writestd.format(tailFmt, options);
}

function processContent(content){
	assert(Array.isArray(content));
	var length = content.length;
	for(var i=0;i<length;++i){
		processStru(content[i]);
	}
}

function makepath(path){
	if(!path.startsWith('./')){
		path = './' + path;
	}
	return path;
}

function main(){
	// DbgOutput('ARGV[1] = ' + process.argv[1]);
	var filepath = process.argv[2];
	if (!filepath){return;}
	var chunk = JSON.parse(loadTemplate(filepath));

	var content = chunk['content'];
	if(content){
		processContent(content);
	}
}

// Do it.
main();

