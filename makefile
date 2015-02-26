SOURCE = y.tab.c\
	lex.yy.c\
	lib/json/cJSON.c\
	lib/sewrite.c
	
all:
	yacc -d stru2.y
	flex stru2.l
	gcc -std=c99 ${SOURCE} -o parser -lm

clean:
	rm -rf parser
	rm -rf y.tab.h y.tab.c lex.yy.c

	
