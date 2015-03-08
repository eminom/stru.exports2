

#ifndef SE_WRITE_DEF__
#define SE_WRITE_DEF__


typedef enum VarTypeTag{
	vt_Unknown = 0,
	vt_Primitive,
	vt_Class,
	vt_Void
}VarType;

typedef struct ParamLinkTag{
	char *typeName;
	VarType vt;
	struct ParamLinkTag *next;
}ParamLink;

typedef struct MethodLinkTag{
	char *returnTypeName;
	char *methodName;
	ParamLink *params;
	struct MethodLinkTag *next;
}MethodLink;

typedef struct StruLinkTag{
	char *name;
	char *orgClass;
	char *baseClass;
	char *metaName;
	MethodLink *methods;
	struct StruLinkTag* next;
}StruLink;

typedef struct StaticLinkTag{
	char *name;
	char *returnType;
	ParamLink *params;
	struct StaticLinkTag* next;
}StaticLink;






extern char *methodType;
extern char *methodName;
extern char *curExporting;
extern char *curDeriving;
extern char *stMethodName;
extern char *stMethodType;
extern char *curVarType;

extern StruLink *curStru;
extern ParamLink *curParam;
extern StaticLink *curStaticLink;


ParamLink* se_createParamLink(const char *type, VarType, ParamLink *previous);
MethodLink* se_createMethodLink(const char *name, const char*type, ParamLink *param, MethodLink *previous);
StruLink* se_createStruLink(const char *name, const char*org, const char*meta, const char *base, StruLink *previous);
StaticLink* se_createStaticLink(const char *name, const char *returnType, ParamLink *param, StaticLink *previous);

void se_disposeStruLink(StruLink *now);
void se_disposeStaticLink(StaticLink *now);


#include "json/cJSON.h"
void se_writeStaticLink(cJSON *host, StaticLink *now);
void se_writeStruLink(cJSON *host, StruLink *now);


#endif
