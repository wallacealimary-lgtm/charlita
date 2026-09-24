# Verb list for Charlita. Order = teaching priority (frequency blended with everyday usefulness).
# Format: infinitive | english senses separated by ';' each "base,past,participle" (3sg/-ing derived) | tags
# tag 'nosig' = excluded from ¿Qué significa? (meaning not transparent when conjugated)
CORE = """
ser|be,was,been|
estar|be,was,been|
haber|have,had,had|nosig
tener|have,had,had|
hacer|do,did,done;make,made,made|
poder|can,could,been able|modal
decir|say,said,said;tell,told,told|
ir|go,went,gone|
ver|see,saw,seen|
dar|give,gave,given|
saber|know,knew,known|
querer|want,wanted,wanted;love,loved,loved|
llegar|arrive,arrived,arrived|
pasar|pass,passed,passed;spend,spent,spent;happen,happened,happened|
deber|must,had to,had to|modal
poner|put,put,put|
parecer|seem,seemed,seemed|
quedar|stay,stayed,stayed;meet up,met up,met up|
creer|believe,believed,believed;think,thought,thought|
hablar|speak,spoke,spoken;talk,talked,talked|
llevar|carry,carried,carried;wear,wore,worn;take,took,taken|
dejar|leave,left,left;let,let,let|
seguir|follow,followed,followed;continue,continued,continued|
encontrar|find,found,found|
llamar|call,called,called|
venir|come,came,come|
pensar|think,thought,thought|
salir|go out,went out,gone out;leave,left,left|
volver|return,returned,returned;come back,came back,come back|
tomar|take,took,taken;drink,drank,drunk|
conocer|know,knew,known;meet,met,met|
vivir|live,lived,lived|
sentir|feel,felt,felt|
tratar|try,tried,tried;treat,treated,treated|
mirar|look,looked,looked;watch,watched,watched|
contar|tell,told,told;count,counted,counted|
empezar|start,started,started;begin,began,begun|
esperar|wait,waited,waited;hope,hoped,hoped;expect,expected,expected|
buscar|look for,looked for,looked for;search,searched,searched|
entrar|enter,entered,entered;go in,went in,gone in|
trabajar|work,worked,worked|
escribir|write,wrote,written|
perder|lose,lost,lost;miss,missed,missed|
entender|understand,understood,understood|
pedir|ask for,asked for,asked for;order,ordered,ordered|
recibir|receive,received,received|
recordar|remember,remembered,remembered;remind,reminded,reminded|
terminar|finish,finished,finished|
comer|eat,ate,eaten|
conseguir|get,got,got;manage,managed,managed|
servir|serve,served,served|
sacar|take out,took out,taken out|
necesitar|need,needed,needed|
mantener|keep,kept,kept;maintain,maintained,maintained|
leer|read,read,read|
caer|fall,fell,fallen|
cambiar|change,changed,changed|
crear|create,created,created|
abrir|open,opened,opened|
oír|hear,heard,heard|
acabar|finish,finished,finished;end,ended,ended|
ganar|win,won,won;earn,earned,earned|
traer|bring,brought,brought|
morir|die,died,died|
aceptar|accept,accepted,accepted|
comprender|understand,understood,understood|
explicar|explain,explained,explained|
preguntar|ask,asked,asked|
tocar|touch,touched,touched;play,played,played|
estudiar|study,studied,studied|
nacer|be born,was born,been born|nosig
correr|run,ran,run|
usar|use,used,used|
pagar|pay,paid,paid|
ayudar|help,helped,helped|
gustar|please,pleased,pleased|nosig
jugar|play,played,played|
escuchar|listen,listened,listened;hear,heard,heard|
ofrecer|offer,offered,offered|
descubrir|discover,discovered,discovered|
intentar|try,tried,tried|
beber|drink,drank,drunk|
dormir|sleep,slept,slept|
comprar|buy,bought,bought|
viajar|travel,travelled,travelled|
conducir|drive,drove,driven|
coger|take,took,taken;catch,caught,caught;grab,grabbed,grabbed|
olvidar|forget,forgot,forgotten|
preferir|prefer,preferred,preferred|
enviar|send,sent,sent|
elegir|choose,chose,chosen|
mover|move,moved,moved|
sentar|seat,seated,seated|
subir|go up,went up,gone up;climb,climbed,climbed|
bajar|go down,went down,gone down|
cerrar|close,closed,closed;shut,shut,shut|
pagar_dup||
decidir|decide,decided,decided|
aprender|learn,learnt,learnt;learn,learned,learned|
enseñar|teach,taught,taught;show,showed,shown|
cocinar|cook,cooked,cooked|
limpiar|clean,cleaned,cleaned|
andar|walk,walked,walked|
"""

RESERVE = """
repetir|repeat,repeated,repeated|
contestar|answer,answered,answered|
responder|answer,answered,answered;reply,replied,replied|
invitar|invite,invited,invited|
visitar|visit,visited,visited|
alquilar|rent,rented,rented|
vender|sell,sold,sold|
costar|cost,cost,cost|
devolver|return,returned,returned;give back,gave back,given back|
probar|try,tried,tried;taste,tasted,tasted|
cortar|cut,cut,cut|
romper|break,broke,broken|
arreglar|fix,fixed,fixed|
construir|build,built,built|
destruir|destroy,destroyed,destroyed|
incluir|include,included,included|
huir|flee,fled,fled|
caber|fit,fitted,fitted|
valer|be worth,was worth,been worth|nosig
soler|usually do,usually did,usually done|nosig
doler|hurt,hurt,hurt|
llover|rain,rained,rained|nosig
nevar|snow,snowed,snowed|nosig
despertar|wake,woke,woken|
acostar|put to bed,put to bed,put to bed|
vestir|dress,dressed,dressed|
reír|laugh,laughed,laughed|
sonreír|smile,smiled,smiled|
freír|fry,fried,fried|
seguir_dup||
medir|measure,measured,measured|
impedir|prevent,prevented,prevented|
corregir|correct,corrected,corrected|
dirigir|direct,directed,directed;manage,managed,managed|
exigir|demand,demanded,demanded|
proteger|protect,protected,protected|
recoger|pick up,picked up,picked up;collect,collected,collected|
escoger|choose,chose,chosen|
convencer|convince,convinced,convinced|
vencer|defeat,defeated,defeated|
merecer|deserve,deserved,deserved|
agradecer|thank,thanked,thanked|
crecer|grow,grew,grown|
desaparecer|disappear,disappeared,disappeared|
obedecer|obey,obeyed,obeyed|
producir|produce,produced,produced|
traducir|translate,translated,translated|
reducir|reduce,reduced,reduced|
introducir|introduce,introduced,introduced;insert,inserted,inserted|
obtener|obtain,obtained,obtained;get,got,got|
contener|contain,contained,contained|
detener|stop,stopped,stopped;arrest,arrested,arrested|
sostener|hold,held,held|
proponer|propose,proposed,proposed|
suponer|suppose,supposed,supposed|
componer|compose,composed,composed|
imponer|impose,imposed,imposed|
disponer|arrange,arranged,arranged|
convenir|suit,suited,suited|
prevenir|prevent,prevented,prevented|
intervenir|intervene,intervened,intervened|
deshacer|undo,undid,undone|
satisfacer|satisfy,satisfied,satisfied|
prever|foresee,foresaw,foreseen|
atraer|attract,attracted,attracted|
distraer|distract,distracted,distracted|
cubrir|cover,covered,covered|
resolver|solve,solved,solved|
envolver|wrap,wrapped,wrapped|
morder|bite,bit,bitten|
oler|smell,smelled,smelled|
jugar_dup||
colgar|hang,hung,hung|
rogar|beg,begged,begged|
soñar|dream,dreamt,dreamt|
mostrar|show,showed,shown|
demostrar|prove,proved,proved|
encender|turn on,turned on,turned on;light,lit,lit|
defender|defend,defended,defended|
atender|attend to,attended to,attended to|
comenzar|begin,began,begun;start,started,started|
confesar|confess,confessed,confessed|
negar|deny,denied,denied|
calentar|heat,heated,heated|
gobernar|govern,governed,governed|
atravesar|cross,crossed,crossed|
fregar|scrub,scrubbed,scrubbed;wash up,washed up,washed up|
tender|hang out,hung out,hung out|
querer_dup||
advertir|warn,warned,warned|
divertir|amuse,amused,amused|
mentir|lie,lied,lied|
hervir|boil,boiled,boiled|
sugerir|suggest,suggested,suggested|
competir|compete,competed,competed|
despedir|say goodbye,said goodbye,said goodbye;fire,fired,fired|
elegir_dup||
conocer_dup||
nadar|swim,swam,swum|
bailar|dance,danced,danced|
cantar|sing,sang,sung|
pintar|paint,painted,painted|
dibujar|draw,drew,drawn|
llorar|cry,cried,cried|
gritar|shout,shouted,shouted|
odiar|hate,hated,hated|
amar|love,loved,loved|
besar|kiss,kissed,kissed|
casar|marry,married,married|
cuidar|look after,looked after,looked after|
guardar|keep,kept,kept;save,saved,saved|
ahorrar|save,saved,saved|
gastar|spend,spent,spent|
cobrar|charge,charged,charged|
prestar|lend,lent,lent|
pedir_dup||
reservar|book,booked,booked|
aparcar|park,parked,parked|
tirar|throw,threw,thrown;pull,pulled,pulled|
empujar|push,pushed,pushed|
lavar|wash,washed,washed|
secar|dry,dried,dried|
planchar|iron,ironed,ironed|
calmar|calm,calmed,calmed|
preocupar|worry,worried,worried|
molestar|bother,bothered,bothered|
quejar|complain,complained,complained|nosig
equivocar|get wrong,got wrong,got wrong|nosig
apetecer|feel like,felt like,felt like|nosig
encantar|delight,delighted,delighted|nosig
importar|matter,mattered,mattered|
faltar|be missing,was missing,been missing|nosig
sobrar|be left over,was left over,been left over|nosig
tardar|take time,took time,taken time|
durar|last,lasted,lasted|
ocurrir|happen,happened,happened|
suceder|happen,happened,happened|
existir|exist,existed,existed|
permitir|allow,allowed,allowed|
prohibir|forbid,forbade,forbidden|
reunir|gather,gathered,gathered|
avisar|warn,warned,warned;let know,let know,let know|
apagar|turn off,turned off,turned off|
cargar|load,loaded,loaded;charge,charged,charged|
bañar|bathe,bathed,bathed|
duchar|shower,showered,showered|
cenar|have dinner,had dinner,had dinner|
desayunar|have breakfast,had breakfast,had breakfast|
almorzar|have lunch,had lunch,had lunch|
merendar|have a snack,had a snack,had a snack|
charlar|chat,chatted,chatted|
quedar_dup||
realizar|carry out,carried out,carried out|
lograr|achieve,achieved,achieved|
alcanzar|reach,reached,reached|
cumplir|fulfil,fulfilled,fulfilled|
presentar|present,presented,presented;introduce,introduced,introduced|
considerar|consider,considered,considered|
reconocer|recognise,recognised,recognised|
convertir|convert,converted,converted;turn into,turned into,turned into|
formar|form,formed,formed|
aparecer|appear,appeared,appeared|
resultar|turn out,turned out,turned out|
"""

# Hand-checked irregular forms — build fails if the conjugator disagrees.
CHECKS = [
 ("ser","ind_presente",5,"son"),("ser","ind_indefinido",0,"fui"),("ir","ind_indefinido",0,"fui"),
 ("ser","ind_imperfecto",3,"éramos"),("ir","ind_imperfecto",0,"iba"),("ver","ind_imperfecto",0,"veía"),
 ("estar","ind_indefinido",0,"estuve"),("tener","ind_indefinido",2,"tuvo"),("hacer","ind_indefinido",2,"hizo"),
 ("poder","ind_indefinido",0,"pude"),("poner","ind_indefinido",0,"puse"),("decir","ind_indefinido",5,"dijeron"),
 ("traer","ind_indefinido",5,"trajeron"),("conducir","ind_indefinido",0,"conduje"),("querer","ind_indefinido",0,"quise"),
 ("saber","ind_indefinido",0,"supe"),("venir","ind_indefinido",0,"vine"),("dar","ind_indefinido",0,"di"),
 ("andar","ind_indefinido",0,"anduve"),("dormir","ind_indefinido",2,"durmió"),("pedir","ind_indefinido",2,"pidió"),
 ("leer","ind_indefinido",2,"leyó"),("oír","ind_presente",0,"oigo"),("oír","ind_presente",2,"oye"),
 ("tener","ind_futuro",0,"tendré"),("poder","ind_futuro",0,"podré"),("decir","ind_futuro",0,"diré"),
 ("hacer","ind_futuro",0,"haré"),("salir","ind_futuro",0,"saldré"),("querer","ind_futuro",0,"querré"),
 ("saber","ind_condicional",0,"sabría"),("poner","ind_condicional",0,"pondría"),("venir","ind_condicional",4,"vendríais"),
 ("hacer","ind_perfecto",0,"he hecho"),("decir","ind_perfecto",0,"he dicho"),("escribir","ind_perfecto",0,"he escrito"),
 ("ver","ind_perfecto",0,"he visto"),("volver","ind_perfecto",0,"he vuelto"),("abrir","ind_perfecto",0,"he abierto"),
 ("morir","ind_perfecto",2,"ha muerto"),("poner","ind_perfecto",0,"he puesto"),("romper","ind_perfecto",0,"he roto"),
 ("ser","sub_presente",0,"sea"),("ir","sub_presente",0,"vaya"),("haber","sub_presente",0,"haya"),
 ("saber","sub_presente",0,"sepa"),("estar","sub_presente",0,"esté"),("dar","sub_presente",0,"dé"),
 ("tener","sub_imperfecto",0,"tuviera"),("ser","sub_imperfecto",0,"fuera"),("hacer","sub_imperfecto",0,"hiciera"),
 ("tener","imp_afirmativo",1,"ten"),("hacer","imp_afirmativo",1,"haz"),("decir","imp_afirmativo",1,"di"),
 ("ir","imp_afirmativo",1,"ve"),("poner","imp_afirmativo",1,"pon"),("salir","imp_afirmativo",1,"sal"),
 ("venir","imp_afirmativo",1,"ven"),("ser","imp_afirmativo",1,"sé"),("hablar","imp_afirmativo",4,"hablad"),
 ("hablar","imp_negativo",1,"no hables"),("hablar","imp_negativo",4,"no habléis"),("ir","imp_negativo",1,"no vayas"),
 ("empezar","ind_presente",0,"empiezo"),("contar","ind_presente",0,"cuento"),("jugar","ind_presente",0,"juego"),
 ("seguir","ind_presente",0,"sigo"),("elegir","ind_presente",0,"elijo"),("coger","ind_presente",0,"cojo"),
 ("conocer","ind_presente",0,"conozco"),("enviar","ind_presente",0,"envío"),("caer","ind_presente",0,"caigo"),
 ("buscar","ind_indefinido",0,"busqué"),("llegar","ind_indefinido",0,"llegué"),("empezar","ind_indefinido",0,"empecé"),
 ("reír","ind_presente",0,"río"),("oler","ind_presente",0,"huelo"),("construir","ind_presente",0,"construyo"),
 ("caber","ind_presente",0,"quepo"),("valer","ind_futuro",0,"valdré"),("satisfacer","ind_indefinido",0,"satisfice"),
]
