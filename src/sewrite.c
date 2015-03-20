

#include <stdio.h>
#include <string.h>
#include <stdlib.h>
//#include <unistd.h>
#include "sewrite.h"
#include "json/cJSON.h"

extern char* strdup(const char*);

ParamDefault *curParamDefault = 0;
ParamLink* curParam = 0;
StruLink* curStru = 0;
StaticLink *curStaticLink = 0;

char *methodType = 0;
char *methodName = 0;
char *curExporting = 0;
char *curDeriving = 0;
char *stMethodName = 0;
char *stMethodType = 0;
char *curVarType = 0;


#define DisposeStr(a)	\
	if(a){free(a); a = 0;}

ParamLink* se_createParamLink(const char *type, VarType varType, ParamDefault *paramDefault, ParamLink *previous){
	ParamLink *rv = (ParamLink*)malloc(sizeof(ParamLink));
	memset(rv, 0, sizeof(*rv));

	rv->typeName = strdup(type);
	rv->vt = varType;
	rv->param_default = paramDefault;

	rv->next = previous;
	return rv;
}

MethodLink* se_createMethodLink(const char *name, const char*type, ParamLink *param, MethodLink *previous){
	MethodLink *rv = (MethodLink*)malloc(sizeof(MethodLink));
	memset(rv, 0, sizeof(*rv));

	rv->returnTypeName = strdup(type);
	rv->methodName = strdup(name);
	rv->params = param;

	rv->next = previous;
	return rv;
}

StruLink* se_createStruLink(const char *name, const char*org, const char*meta, const char *base, StruLink *previous){
	StruLink *rv = (StruLink*)malloc(sizeof(StruLink));
	memset(rv, 0, sizeof(*rv));
	rv->name = strdup(name);
	rv->orgClass = strdup(org);
	if(base){
		rv->baseClass = strdup(base);
	}
	rv->metaName = strdup(meta);
	rv->next = previous;
	return rv;
}

ParamDefault* se_createParamDefault(VarDefault dt, const char *param_in) {
	ParamDefault *pd = (ParamDefault*)malloc(sizeof(ParamDefault));
	memset(pd, 0, sizeof(*pd));
	pd->param_in = strdup(param_in);
	pd->var_default = dt;
	return pd;
}

void se_disposeParamDefault(ParamDefault *now){
	if(!now){return;}
	DisposeStr(now->param_in);
	free(now);
}

void se_disposeParamLink(ParamLink *now){
	if(!now){return;}
	se_disposeParamDefault(now->param_default);
	DisposeStr(now->typeName)

	se_disposeParamLink(now->next);
	free(now);
}

void se_disposeMethodLink(MethodLink *now){
	if(!now){return;}
	DisposeStr(now->methodName)
	DisposeStr(now->returnTypeName)

	se_disposeParamLink(now->params);
	se_disposeMethodLink(now->next);
	free(now);
}

void se_disposeStruLink(StruLink *now){
	if(!now){return;}
	DisposeStr(now->name)
	DisposeStr(now->orgClass)
	DisposeStr(now->baseClass)
	DisposeStr(now->metaName)

	se_disposeMethodLink(now->methods);
	se_disposeStruLink(now->next);
	free(now);
}

StaticLink* se_createStaticLink(const char *name, const char *returnType,
   ParamLink *param, StaticLink *previous){
	StaticLink *rv = (StaticLink*)malloc(sizeof(StaticLink));
	memset(rv, 0, sizeof(*rv));
	rv->name = strdup(name);
	rv->returnType = strdup(returnType);
	rv->params = param;
	rv->next = previous;
	return rv;
}

// Now writings starts.

cJSON* getType(VarType vt){
	switch(vt){
	case vt_Unknown:
		return cJSON_CreateNull();
	case vt_Primitive:
		return cJSON_CreateFalse();
	case vt_Class:
		return cJSON_CreateTrue();
	default:
		fprintf(stderr,"Error vt!\n");
		abort();
		break;
	}
}

void _se_writeParamDefault(cJSON *obj, ParamDefault *now, const char *type, const char* methodName){
	if(!now){return;}
	//Checking...
	switch(now->var_default){
	case dt_Integer:
		if(strcmp(type, "int")){
			fprintf(stderr, "Type mismatched from \"%s\" to dt_Integer in %s\n", type, methodName);
			abort();
		}
		break;
	case dt_Boolean:
		if(strcmp(type, "bool")){
			fprintf(stderr, "Type mismatched from \"%s\" to dt_Boolean in %s\n", type, methodName);
			abort();
		}
		break;
	case dt_Float:
		if(strcmp(type, "float")){
			fprintf(stderr, "Type mismatched from \"%s\" to dt_Float in %s\n", type, methodName);
			abort();
		}
		break;
	case dt_String:
		if(strcmp(type, "const char*") && strcmp(type, "char*")){
			fprintf(stderr, "Type mismatched from \"%s\" to dt_String in %s\n", type, methodName);
			abort();
		}
		break;
	default:
		fprintf(stderr, "ERROR Var default :%d in %s\n", now->var_default, methodName);
		abort();
		break;
	}
	cJSON_AddItemToObject(obj, "default", cJSON_CreateString(now->param_in));
}


void _se_writeParamLinkRun(cJSON *ar, ParamLink *now, const char *methodName){
	if(!now){return;}
	_se_writeParamLinkRun(ar, now->next, methodName);

	cJSON *o = cJSON_CreateObject();
	cJSON_AddItemToObject(o, "isClass", getType(now->vt));
	cJSON_AddItemToObject(o, "type", cJSON_CreateString(now->typeName));
	_se_writeParamDefault(o, now->param_default, now->typeName, methodName);
	//
	cJSON_AddItemToArray(ar, o);
}

void _se_writeMethodLinkRun(cJSON *ar, MethodLink *now){
	if(!now){return;}
	_se_writeMethodLinkRun(ar, now->next);

	//abort();
	cJSON *o = cJSON_CreateObject();
	cJSON_AddItemToObject(o, "return", cJSON_CreateString(now->returnTypeName));
	cJSON_AddItemToObject(o, "call", cJSON_CreateString(now->methodName));
	cJSON *paramArray = cJSON_CreateArray();
	_se_writeParamLinkRun(paramArray, now->params, now->methodName);
	cJSON_AddItemToObject(o, "params", paramArray);

	//
	cJSON_AddItemToArray(ar, o);
}


void _se_writeStruLinkRun(cJSON *ar, StruLink *now){
	if(!now){return;}
	_se_writeStruLinkRun(ar, now->next);

	cJSON *o = cJSON_CreateObject();
	cJSON_AddItemToObject(o, "name", cJSON_CreateString(now->name));
	cJSON_AddItemToObject(o, "origin", cJSON_CreateString(now->orgClass));
	cJSON_AddItemToObject(o, "meta", cJSON_CreateString(now->metaName));
	if(now->baseClass){
		cJSON_AddItemToObject(o, "base", cJSON_CreateString(now->baseClass));
	}

	cJSON *methodArray = cJSON_CreateArray();
	_se_writeMethodLinkRun(methodArray, now->methods);
	cJSON_AddItemToObject(o, "methods", methodArray);

	//
	cJSON_AddItemToArray(ar, o);
}

void se_writeStruLink(cJSON *host, StruLink *now)
{
	cJSON* struArray = cJSON_CreateArray();
	cJSON_AddItemToObject(host, "content", struArray);
	_se_writeStruLinkRun(struArray, now);
}

void se_disposeStaticLink(StaticLink *now){
	if(!now){return;}
	se_disposeStaticLink(now->next);
	se_disposeParamLink(now->params);

	DisposeStr(now->name)
	DisposeStr(now->returnType)
	free(now);
}

void _se_writeStaticLinkRun(cJSON *ar, StaticLink *now){
	if (!now) {return;}
	_se_writeStaticLinkRun(ar, now->next);

	cJSON *o = cJSON_CreateObject();
	cJSON_AddItemToObject(o, "name", cJSON_CreateString(now->name));
	cJSON_AddItemToObject(o, "type", cJSON_CreateString(now->returnType));
	cJSON *mtAr = cJSON_CreateArray();
	_se_writeParamLinkRun(mtAr, now->params, now->name);
	cJSON_AddItemToObject(o, "params", mtAr);
	cJSON_AddItemToArray(ar, o);
}


void se_writeStaticLink(cJSON *host, StaticLink *now){
	//TODO
	cJSON* staticArray = cJSON_CreateArray();
	cJSON_AddItemToObject(host, "statics", staticArray);
	_se_writeStaticLinkRun(staticArray, now);
}





