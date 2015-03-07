SOURCE = y.tab.c\
	lex.yy.c\
	lib/json/cJSON.c\
	src/sewrite.c

INCLUDE_DIRS = lib
	
all:
	yacc -d stru2.y
	flex stru2.l
	gcc -std=c99 ${SOURCE} -I${INCLUDE_DIRS} -o parser -lm

clean:
	rm -rf parser
	rm -rf y.tab.h y.tab.c lex.yy.c

	
