

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
	char *metaName;
	MethodLink *methods;
	struct StruLinkTag* next;
}StruLink;


extern char *methodType;
extern char *methodName;
extern char *curExporting;

extern StruLink *curStru;
extern ParamLink *curParam;


ParamLink* se_createParamLink(const char *type, VarType, ParamLink *previous);
MethodLink* se_createMethodLink(const char *name, const char*type, ParamLink *param, MethodLink *previous);
StruLink* se_createStruLink(const char *name, const char*org, const char*meta, StruLink *previous);

void se_writeStruLink(StruLink *now);
void se_disposeStruLink(StruLink *now);

#endif