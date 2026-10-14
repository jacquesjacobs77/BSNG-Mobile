#!/usr/bin/env python3
"""Generate BSNG Studio launcher icons locally and in CI, no external image downloads."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import math

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"assets"
OUT.mkdir(parents=True,exist_ok=True)
S=1024
def hexagon(cx,cy,r):
    return [(int(cx+r*math.cos(math.pi/6+i*math.pi/3)),int(cy+r*math.sin(math.pi/6+i*math.pi/3))) for i in range(6)]
def make_background():
    im=Image.new("RGBA",(S,S))
    d=ImageDraw.Draw(im)
    for y in range(S):
        t=y/(S-1)
        d.line([(0,y),(S,y)],fill=(int(5+5*t),int(13+9*t),int(29+14*t),255))
    # Subtle technical grid; deliberately behind the focal mark.
    for i in range(0,S,64):
        d.line([(i,0),(i,S)],fill=(32,65,92,46),width=1)
        d.line([(0,i),(S,i)],fill=(32,65,92,46),width=1)
    return im
def draw_mark(im,r):
    cx=cy=S//2
    glow=Image.new("RGBA",(S,S),(0,0,0,0))
    g=ImageDraw.Draw(glow)
    for width in [32,23,13]:
        g.line(hexagon(cx,cy,r)+[hexagon(cx,cy,r)[0]],fill=(40,226,235,95),width=width,joint="curve")
    for k in range(17):
        y=cy-r*.58+k*(r*1.16/16)
        a=cx-0.27*r*math.sin(k*.46)
        b=cx+0.27*r*math.sin(k*.46)
        g.line([(int(a),int(y)),(int(b),int(y))],fill=(110,88,250,80),width=15)
    im.alpha_composite(glow.filter(ImageFilter.GaussianBlur(40)))
    d=ImageDraw.Draw(im,"RGBA")
    outer=hexagon(cx,cy,r)
    inner=hexagon(cx,cy,r*.84)
    d.line(outer+[outer[0]],fill=(63,231,235,255),width=18,joint="curve")
    d.line(inner+[inner[0]],fill=(72,147,205,210),width=6,joint="curve")
    # Stylized genomic strands inside a research hexagon.
    count=19
    ys=[cy-r*.65+i*1.3*r/(count-1) for i in range(count)]
    def left(i): return cx-(r*.30)*math.sin(i*2*math.pi/11.0)
    def right(i):return cx+(r*.30)*math.sin(i*2*math.pi/11.0)
    for i,y in enumerate(ys):
        d.line([(int(left(i)),int(y)),(int(right(i)),int(y))],fill=(103,221,243,205) if i%2 else (173,121,255,200),width=8)
    d.line([(int(left(i)),int(y)) for i,y in enumerate(ys)],fill=(82,237,233,255),width=16,joint="curve")
    d.line([(int(right(i)),int(y)) for i,y in enumerate(ys)],fill=(171,127,255,255),width=16,joint="curve")
    for i,y in enumerate(ys):
        for x,col in [(left(i),(89,255,246,255)),(right(i),(191,148,255,255))]:
            xx=int(x); yy=int(y); d.ellipse([(xx-7,yy-7),(xx+7,yy+7)],fill=col)
    d.ellipse([(cx-10,cy-10),(cx+10,cy+10)],fill=(244,255,255,250))
    return im
main=draw_mark(make_background(),312)
main.convert("RGB").save(OUT/"icon.png",optimize=True)
adaptive=draw_mark(Image.new("RGBA",(S,S),(0,0,0,0)),220)
adaptive.save(OUT/"adaptive-icon.png",optimize=True)
print("Generated BSNG Studio icon.png and adaptive-icon.png")
