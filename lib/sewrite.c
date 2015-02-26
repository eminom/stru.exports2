

#include <stdio.h>
#include <string.h>
#include <stdlib.h>
//#include <unistd.h>
#include "sewrite.h"
#include "json/cJSON.h"

ParamLink* curParam = 0;
StruLink* curStru = 0;

char *methodType = 0;
char *methodName = 0;
char *curExporting = 0;

#define DisposeStr(a)	\
	if(a){free(a); a = 0;}

ParamLink* se_createParamLink(const char *type, VarType varType, ParamLink *previous){
	ParamLink *rv = (ParamLink*)malloc(sizeof(ParamLink));
	memset(rv, 0, sizeof(*rv));

	rv->typeName = strdup(type);
	rv->vt = varType;

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

StruLink* se_createStruLink(const char *name, const char*org, const char*meta, StruLink *previous){
	StruLink *rv = (StruLink*)malloc(sizeof(StruLink));
	memset(rv, 0, sizeof(*rv));
	rv->name = strdup(name);
	rv->orgClass = strdup(org);
	rv->metaName = strdup(meta);
	rv->next = previous;
	return rv;
}

void se_disposeParamLink(ParamLink *now){
	if(!now){return;}
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
	DisposeStr(now->metaName)

	se_disposeMethodLink(now->methods);
	se_disposeStruLink(now->next);
	free(now);
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


void _se_writeParamLinkRun(cJSON *ar, ParamLink *now){
	if(!now){return;}
	_se_writeParamLinkRun(ar, now->next);

	cJSON *o = cJSON_CreateObject();
	cJSON_AddItemToObject(o, "isClass", getType(now->vt));
	cJSON_AddItemToObject(o, "type", cJSON_CreateString(now->typeName));

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
	_se_writeParamLinkRun(paramArray, now->params);
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

	cJSON *methodArray = cJSON_CreateArray();
	_se_writeMethodLinkRun(methodArray, now->methods);
	cJSON_AddItemToObject(o, "methods", methodArray);

	//
	cJSON_AddItemToArray(ar, o);
}


void se_writeStruLink(StruLink *now)
{
	cJSON* root = cJSON_CreateObject();
	cJSON* struArray = cJSON_CreateArray();
	cJSON_AddItemToObject(root, "content", struArray);
	_se_writeStruLinkRun(struArray, now);

	char *outs = cJSON_Print(root);
	printf("%s\n", outs);
	free(outs);
	cJSON_Delete(root);
}







