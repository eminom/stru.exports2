

var fs = require('fs');
var assert = require('assert');
var format = require('./third').formatKey;
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

ContentProcessor.prototype.processMethod = function(method, struOpt){
	var opt = {
		ReturnType: method.return,
		MethodName: method.call,
		ExportingClass: struOpt.ExportingClass,
		BaseClass: struOpt.BaseClass,
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
			var msg;
			if(opt.BaseClass){
				msg = format('static_cast<${ExportingClass}*>(_ref)->${MethodName}(', opt);
			} else {
				msg = format('_ref->${MethodName}(', opt);
			}
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


//Exporting the structure part
// Two main cases shall be taken care
//  1. class without a base
//  2. class with a base
ContentProcessor.prototype.processStru = function(stru){
	if ( this._flagMap[stru.origin] ) {
		return;
	}
	this._flagMap[stru.origin] = true; //Mark as processed;
	if ( stru.base && ! this._flagMap[stru.base] && this._contentMap[stru.base] ){
		var parent = this._contentMap[stru.base];
		this.processStru(parent);
	}

	// DbgOutput('Process stru ********************');
	//this.writestd.out(JSON.stringify(stru));
	var options = {
		TimeString:new Date(),
		ExportingClass:stru.origin,
		WrapperClass:stru.name,		//~name is good enough
		MetaName:stru.meta,
	};

	if (stru.base){
		options.BaseClass = stru.base;
		options.WrapperClassBase = stru.base + "Wrapper";
		options.BaseClassIsPresent = 1;
	} else {
		options.BaseClassIsPresent = 0;
	}

	//Head
	this.writestd.format(loadTemplate('tmpl/head'), options);
	//Structure
	this.writestd.format('struct ${WrapperClass}', options);
	if (options.BaseClass) {
		this.writestd.format(' : public ${WrapperClassBase} ', options);
	}

	this.writestd.format('{\n', options);
	//Members(Method, fields)
	this.writestd.push();

	//Instance Methods
	var methods = stru.methods;
	assert(Array.isArray(methods), "must be method");
	var methodCount = methods.length;
	for(var i=0;i<methodCount;++i){
		this.processMethod(methods[i], options);
	}

	//Fields
	if (! options.BaseClass ) {
		this.writestd.format("${ExportingClass}* _ref;", options);
	}
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

	var flagMap  = {};
	var contentMap = {};
	for(var i=0;i<length;++i){
		var thisOne = content[i];
		contentMap[thisOne.origin] = thisOne;
		flagMap[thisOne.origin] = false;
	}

	this._flagMap = flagMap;
	this._contentMap = contentMap;
	for(var i=0;i<length;++i){
		this.processStru(content[i]);
	}
};

module.exports = ContentProcessor;
