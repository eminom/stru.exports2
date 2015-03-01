

var fs = require('fs');
var assert = require('assert');
var format = require('./format').formatKey;
var typeIn = require('./typecaster').in;

// This should be made to public.
function loadTemplate(path){
	var content = fs.readFileSync(path,{encoding:'utf8'});
	return content;
}

function ContentProcessor(stdWriter){
	this.writestd = stdWriter;
}


ContentProcessor.prototype.processMethodImpl = function(method, exporting, wrapper){
	var msg = format(loadTemplate('tmpl/body'),{
			ExportingClass:exporting,
			Name:method.call,
			ParamCount:method.params.length + 1
	});
	this.writestd.out(msg);
	var self = this;
	this.writestd.scope(
		function(){
			var params = method.params;
			var count = params.length;
			var line;

			//The first one is wrapper for sure.
			self.writestd.format("${Type}* p1 = checkUserData<${Type}>(L, 1);", {
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
				self.writestd.out(line);
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
			self.writestd.out(call);
			self.writestd.out('return 0;');
		}
	);
	this.writestd.out('}\n');
};

ContentProcessor.prototype.processMethod = function(method){
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
	this.writestd.out(out);
	this.writestd.out('{');
	//var w = this.writestd.out;

	var self = this;
	this.writestd.scope(
		function(){
			var msg = format('_ref->${MethodName}(', opt);
			for(var i=0;i<params.length;++i){
				var p = params[i].isClass ? 'p'+(i+1)+'->_ref' : 'p' +(i+1);
				msg += (i?',':'') + p;
			}
			msg += ');';
			self.writestd.out(msg);
		}
	);
	this.writestd.out('}');
};

ContentProcessor.prototype.processStru = function(stru){
	// DbgOutput('Process stru ********************');
	//this.writestd.out(JSON.stringify(stru));
	var options = {
		TimeString:new Date(),
		ExportingClass:stru.origin,
		WrapperClass:stru.name,		//~name is good enough
		MetaName:stru.meta,
	};

	//Head
	this.writestd.format(loadTemplate('tmpl/head'), options);

	//Structure
	this.writestd.format('struct ${WrapperClass} {\n', options);

	//Members(Method, fields)
	this.writestd.push();

	//Instance Methods
	var methods = stru.methods;
	assert(Array.isArray(methods), "must be method");
	var methodCount = methods.length;
	for(var i=0;i<methodCount;++i){
		this.processMethod(methods[i]);
	}

	//Fields
	this.writestd.format("${ExportingClass}* _ref;", options);
	this.writestd.format("static const char* MetaName;");

	this.writestd.pop();
	this.writestd.out('};');

	this.writestd.out('');
	this.writestd.out('');
	this.writestd.format("const char* ${WrapperClass}::MetaName = _${ExportingClass}MetaString;", options);
	this.writestd.out('');

	for(var i=0;i<methods.length;++i){
		this.processMethodImpl(methods[i], options.ExportingClass, options.WrapperClass); 
	}

	// the registry
	this.writestd.format("static luaL_Reg ${Name}TmpIndex[] = {", {
		Name:stru.origin,
	});
	var self = this;
	this.writestd.scope(
		function(){
			for(var i=0;i<methods.length;++i){
				self.writestd.format("{\"${Name}\", ${ExportingClass}_${Name}},", {
					ExportingClass:options.ExportingClass,
					Name:methods[i].call
				});
			}
			self.writestd.out("{NULL, NULL}");
		}
	);
	this.writestd.out('};');

	//The loader
	var tailFmt = loadTemplate('tmpl/tail');
	this.writestd.format(tailFmt, options);
};

ContentProcessor.prototype.process = function(content){
	assert(Array.isArray(content));
	var length = content.length;
	for(var i=0;i<length;++i){
		this.processStru(content[i]);
	}
};

module.exports = ContentProcessor;
