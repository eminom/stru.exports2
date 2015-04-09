

var fs = require('fs');
var assert = require('assert');
var format = require('./third').formatKey;
var typeIn = require('./typecaster').in;

function loadTemplate(path){
	var content = fs.readFileSync(path,{encoding:'utf8'});
	return content;
}

var defaultValueTaker = {
	bool:function(v){return v;},
	int:function(v){return v;},
	float:function(v){return v;},
	"const char*":function(v){return "\"" + v + "\"";}
};

function genDefaultIn(type, value){
	if(defaultValueTaker[type]){
		//console.error("Gen one default");
		return defaultValueTaker[type](value);
	}
	throw new Error("Cannot process default for type " + type);
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
	//console.error("Processing ", ss.name, " " , ss.type, "*");

	//Check for default consecutives:>>
	var isNowDefault = false;
	var noDefaultCount = 0;
	for(var i=0;i<pc;++i){
		var one = ss.params[i];
		if(isNowDefault){
			if(! one.default ){
				throw new Error("Consecutive default must be fit for " + ss.name + ":" + ss.type + "*");
			}
		} else {
			if(one.default){
				isNowDefault = true; // And expecting the rest are all with defaults.
			} else {
				noDefaultCount++;
			}
		}
	}
	
	var whole = '';
	for(var i=0;i<pc;++i){
		var one = ss.params[i];
		//console.error("one.type is", one.type);
		if(typeof(typeIn[one.type]) !== "function"){
			console.error("Warning:" + one.type + " is currently unknown !");
			console.error("In function:" + ss.type + "* " + ss.name);
		}

		if(one.default){
			var fmts = [
				"${Type} p${Index};",
				"if(top >= ${CurrentCount}) { p${Index} = ${ComplexInput}; }",
				"else { p${Index} = ${DefaultIn}; }"
			];
			var opts = { Type:one.type, CurrentCount:i+1, Index:i+1, ComplexInput:typeIn[one.type](i+1), DefaultIn:genDefaultIn(one.type, one.default) };
			for(var a=0;a<fmts.length;++a){
					var line = format(fmts[a], opts);
					whole += "\t" + line + "\n";
			}
		} else {
			var line = format("${Type} p${Index} = ${ComplexInput};",
						{Type:one.type, Index:i+1,
						ComplexInput:typeIn[one.type](i+1)
						}
					);
			whole += '\t' + line + '\n';
		}
	}

	var tmpl = loadTemplate('tmpl/creator');
	var out = format(tmpl, {
		MethodName:ss.name,
		ReturnType:ss.type,
		ParamNoDefaultCount:noDefaultCount,
		ParamCount:ss.params.length,
		WrapperClass:ss.type + 'Wrapper',  // customized. 
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
	this.writestd.out("void load_ddStatics(lua_State*L){ luaL_register(L, \"dd\", _ddStatics); }");
};


module.exports = StaticProcessor;
