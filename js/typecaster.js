

//Typecaster for modec.
var format = require('./third').format;
var typeCaster = {
	"int":function(p){return "lua_tointeger(L, " + p + ")"},
	"float":function(p){return "lua_tonumber(L, " + p + ")"},
	"const char*":function(p){return "lua_tostring(L, " + p + ")"},
	"bool":function(p){return "lua_toboolean(L, " + p + ")"},
	"void*":function(p){return "(void*)lua_topointer(L, " + p + ")"},
};

var typeOut = {
	"int":function(){return "lua_pushinteger(tolua_S, retval);\n";  },
	"float":function(){return "lua_pushnumber(tolua_S, retval);\n"; },
	"const char*":function(){return "lua_pushstring(tolua_S, retval);\n";},
	"bool":function(){return "lua_pushboolean(tolua_S, retval);\n"; },
};

module.exports = {
	in:typeCaster,
	out:typeOut
};
