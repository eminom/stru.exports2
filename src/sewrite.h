

#ifndef SE_WRITE_DEF__
#define SE_WRITE_DEF__


typedef enum VarTypeTag{
	vt_Unknown = 0,
	vt_Primitive,
	vt_Class,
	vt_Void
}VarType;

typedef enum VarDefaultTag{
	dt_None = 0,
	dt_Integer = 1,
	dt_Float = 2,
	dt_Boolean = 3,
	dt_String = 4
}VarDefault;

typedef struct ParamDefaultTag{
	char *param_in;
	VarDefault var_default;
}ParamDefault;

typedef struct ParamLinkTag{
	char *typeName;
	VarType vt;
	ParamDefault *param_default;
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
extern ParamDefault *curParamDefault;


ParamDefault* se_createParamDefault(VarDefault theDefaultType, const char *text);
ParamLink* se_createParamLink(const char *type, VarType, ParamDefault *paramDefault, ParamLink *previous);
MethodLink* se_createMethodLink(const char *name, const char*type, ParamLink *param, MethodLink *previous);
StruLink* se_createStruLink(const char *name, const char*org, const char*meta, const char *base, StruLink *previous);
StaticLink* se_createStaticLink(const char *name, const char *returnType, ParamLink *param, StaticLink *previous);

void se_disposeStruLink(StruLink *now);
void se_disposeStaticLink(StaticLink *now);


#include "json/cJSON.h"
void se_writeStaticLink(cJSON *host, StaticLink *now);
void se_writeStruLink(cJSON *host, StruLink *now);


#endif
