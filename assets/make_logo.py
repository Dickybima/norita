# Builds the Norita logo (32x32 pixel art) as an SVG: python3 make_logo.py logo.svg
import math, sys
N=32
g=[[None]*N for _ in range(N)]
C=dict(k="#3a2414",w="#7a4f22",s1="#4aa8f0",s2="#6fbdf5",s3="#9bd3f7",s4="#ffd9a0",sun="#ffd23e",sunL="#fff2a8",
       h1="#7cc644",h2="#5aa83a",soil="#8a5a2e",soilD="#6b4220",st="#3f9a3a",stL="#8bd84a",stD="#1f5a1c",cream="#fff4dc")
cx=cy=15.5
def d(x,y): return math.hypot(x-cx,y-cy)
R=15.6
# badge
for y in range(N):
    for x in range(N):
        r=d(x,y)
        if r>R: continue
        if r>R-1.3: g[y][x]='k'; continue
        if r>R-2.4: g[y][x]='w'; continue
        # sky bands
        g[y][x]= 's1' if y<8 else 's2' if y<13 else 's3' if y<17 else 's4'
# sun, in the sky gap above the N's diagonal
for y in range(N):
    for x in range(N):
        if g[y][x] in('s1','s2','s3','s4'):
            if math.hypot(x-16.5,y-6.5)<=3.3: g[y][x]='sunL' if (x,y) in ((15,5),(16,5),(15,6)) else 'sun'
# a couple of tiny clouds
for (x,y) in [(4,14),(5,14),(6,14),(5,13),(25,14),(26,14),(27,14),(26,13)]: g[y][x]='cream'
# hill + field
def hill(x): return 21+round(1.2*math.cos((x-16)/6.5))
for y in range(N):
    for x in range(N):
        if g[y][x] in ('k','w') or g[y][x] is None: continue
        if y>=hill(x):
            if y<=hill(x)+1: g[y][x]='h1' if y==hill(x) else 'h2'
            else: g[y][x]='soil' if (y-hill(x))%3!=1 else 'soilD'
# the N, drawn as a sprout: two stems joined by a diagonal
P=set()
for y in range(13,24): P|={(9,y),(10,y),(21,y),(22,y)}
for i in range(10):
    x=11+i; y=13+round(i*10/9)
    P|={(x,y),(x,y+1)}
# teardrop leaves: a big one on the right stem, a smaller one on the left
leafR={(22,12),(23,12),(22,11),(23,11),(24,11),(23,10),(24,10),(25,10),(23,9),(24,9),(25,9),(26,9),(24,8),(25,8),(26,8),(25,7)}
leafL={(9,12),(8,12),(9,11),(8,11),(7,11),(8,10),(7,10),(6,10),(7,9),(6,9),(6,8)}
shape=P|leafR|leafL
for (x,y) in shape:
    for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
        X,Y=x+dx,y+dy
        if (X,Y) not in shape and g[Y][X] not in ('k','w',None) and Y<hill(X): g[Y][X]='stD'
for (x,y) in shape: g[y][x]='st'
for y in range(14,22): g[y][9]='stL'; g[y][21]='stL'
for i in range(9):
    x=11+i; y=13+round(i*10/9); g[y][x]='stL'
for (x,y) in [(22,11),(23,10),(23,9),(24,8),(25,7),(7,9),(6,8),(7,10),(8,11)]: g[y][x]='stL'
for (x,y) in [(23,11),(24,10),(25,9),(8,11),(7,10)]: g[y][x]='h2'   # midribs
# svg with run-length rects
out=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {N} {N}" shape-rendering="crispEdges">','<title>Norita</title>']
for y in range(N):
    x=0
    while x<N:
        c=g[y][x]
        if c is None: x+=1; continue
        x2=x
        while x2+1<N and g[y][x2+1]==c: x2+=1
        out.append(f'<rect x="{x}" y="{y}" width="{x2-x+1}" height="1" fill="{C[c]}"/>')
        x=x2+1
out.append('</svg>')
open(sys.argv[1],'w').write('\n'.join(out)+'\n')
