

var fs = require('fs');
var assert = require('assert');
var format = require('./third').formatKey;
var typeIn = require('./typecaster').in;

function loadTemplate(path){
	var content = fs.readFileSync(path,{encoding:'utf8'});
	return content;
}

function StaticProcessor(stdOut){
	this.writestd = stdOut;
}

StaticProcessor.prototype.processStatic = function(ss){
	var paramList = '';
	var pc = ss.params.length;
	for(var i=0;i<pc;++i){
		paramList += (i>0?',':'') + 'p' + (i+1);
	}

	var whole = '';
	for(var i=0;i<pc;++i){
		var one = ss.params[i];
		var line = format("${Type} p${Index} = ${ComplexInput};",
						{Type:one.type, Index:i+1,
						ComplexInput:typeIn[one.type](i+1)
						}
					);
		whole += '\t' + line + '\n';
	}

	var tmpl = loadTemplate('tmpl/creator');
	var out = format(tmpl, {
		MethodName:ss.name,
		ReturnType:ss.type,
		ParamCount:ss.params.length,
		WrapperClass:'EsNodeWrapper',  // customized. 
		ParamFetching:whole, 
		ParamList:paramList,
	});

	this.writestd.out(out);
};

StaticProcessor.prototype.process = function(statics){
	assert(Array.isArray(statics), 'static must be array');
	var length = statics.length;
	for(var i=0;i<length;++i){
		this.processStatic(statics[i]);
	}

	//The big table
	this.writestd.out("static luaL_Reg _ddStatics[] = {");
	this.writestd.push();
	for(var i=0;i<length;++i){
		this.writestd.format("{\"${MethodName}${ReturnType}\", ${MethodName}${ReturnType} },", {
			MethodName:statics[i].name,
			ReturnType:statics[i].type,
		});
	}
	this.writestd.out("{NULL, NULL}");
	this.writestd.pop();
	this.writestd.out('};');
	this.writestd.out("void load_ddStatics(){ _DeclareState() luaL_register(L, \"dd\", _ddStatics); }");
};


module.exports = StaticProcessor;
