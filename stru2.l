
%{
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#define YYSTYPE char*
#include "y.tab.h"

int yylex(void);

extern char *strdup(const char*);

#define PRT(...)   {fprintf(stderr, __VA_ARGS__);}

%}

%option yylineno

%%
const {
	return TokenConst;
}

struct {
	return TokenStruct;
}

static {
	return TokenStatic;
}

class {
	return TokenClass;
}

\"[a-zA-Z_]+\" {
	int length = strlen(yytext);
	char *buff = (char*)malloc((length - 2 + 1)*sizeof(char));
	memset(buff, 0, (length-2+1)*sizeof(char));
	strncpy(buff, yytext+1, length-2);
	yylval = buff;
	return ConstString;
}

[a-zA-Z][a-zA-Z_0-9\$]* {
	yylval = strdup(yytext);
	return Var;
}

\* {
	return TokenStar;
}

; {
	return TokenSemicolon;
}

\-> {
	return TokenArrow;
}

\( {
	return TokenLeftBracket;
}

\) {
	return TokenRightBracket;
}

\{ {
	return TokenLeftOpen;
}

\} {
	return TokenRightEnd;
}

, {
	return TokenComma;
}

= {
	return TokenEqual;
}

[ \t\r\n] {
}

. {
	fprintf(stderr,"Unknown token \"%s\" in line %d\n", yytext, yylineno);
	fprintf(stderr,"yyget_text() = \"%s\"\n", yyget_text());
	abort();
}

%%
int yywrap(void){
	return 1;
}
