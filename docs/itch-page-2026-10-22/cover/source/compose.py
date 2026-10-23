# GenVo itch.io cover composition from genuine game renders (2026-10-22).
# Inputs: a UI-free frame of the shipped Day-100 valley read from the game's
# own canvas, and real evolved organisms from that world drawn by the game's
# sprite renderer. Pixels are only scaled by whole-number nearest-neighbour
# factors; the title is the game's Georgia Bold UI face rendered small and
# scaled the same way so it shares the pixel grid.
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
R=sys.argv[1]; OUT=sys.argv[2]
W,H=1260,1000
GOLD=(242,222,160); DEEP=(19,36,31); INK=(10,18,14)
def background(src,box):
    bg=Image.open(src).convert('RGB').crop(box).resize((W,H),Image.NEAREST)
    bg=ImageEnhance.Brightness(bg).enhance(.62); bg=ImageEnhance.Color(bg).enhance(.9)
    # vignette and a soft lift behind the focal creature
    shade=Image.new('L',(W,H),0); d=ImageDraw.Draw(shade)
    for k in range(60):
        r=int(1.15*max(W,H)*(1-k/60)); a=int(255*(k/60)**1.6*.55)
        d.ellipse((W//2-r,int(H*.58)-r,W//2+r,int(H*.58)+r),fill=a)
    lift=Image.new('RGB',(W,H),(214,206,150))
    bg=Image.composite(lift,bg,shade.point(lambda v:int(v*.32)))
    top=Image.new('L',(W,H),0); dt=ImageDraw.Draw(top)
    for y in range(H):
        a=int(210*max(0,1-y/330)**1.5)+int(170*max(0,(y-H*.84)/(H*.16))**1.4)
        dt.line((0,y,W,y),fill=min(255,a))
    return Image.composite(Image.new('RGB',(W,H),DEEP),bg,top)
def creature(name,factor):
    im=Image.open(f'{R}/organisms-trim/{name}.png').convert('RGBA')
    return im.resize((im.width*factor//8*8//8 if False else im.width*factor//4, im.height*factor//4),Image.NEAREST) if factor%4 else im.resize((im.width*factor//4,im.height*factor//4),Image.NEAREST)
def place(canvas,im,cx,cy,shadow=True):
    x,y=int(cx-im.width/2),int(cy-im.height/2)
    if shadow:
        a=im.split()[3].point(lambda v:150 if v>0 else 0)
        sh=Image.new('RGBA',im.size,(0,0,0,0)); sh.putalpha(a)
        sh=sh.filter(ImageFilter.GaussianBlur(10))
        canvas.alpha_composite(sh,(x+14,y+26))
    canvas.alpha_composite(im,(x,y))
def title(canvas,text='GENVO',scale=6,y=46):
    f=ImageFont.truetype('C:/Windows/Fonts/georgiab.ttf',34)
    l,t,r,b=f.getbbox(text); w,h=r-l+8,b-t+8
    small=Image.new('RGBA',(w,h),(0,0,0,0)); d=ImageDraw.Draw(small)
    for dx,dy in [(-1,0),(1,0),(0,-1),(0,1),(1,1),(2,2)]:
        d.text((4-l+dx,4-t+dy),text,font=f,fill=INK+(255,))
    d.text((4-l,4-t),text,font=f,fill=GOLD+(255,))
    # binarise alpha so the scaled title keeps hard pixel edges
    a=small.split()[3].point(lambda v:255 if v>110 else 0); small.putalpha(a)
    big=small.resize((w*scale,h*scale),Image.NEAREST)
    canvas.alpha_composite(big,((W-big.width)//2,y))
    return y+big.height
def tagline(canvas,text,y,scale=2):
    f=ImageFont.truetype('C:/Windows/Fonts/georgiab.ttf',15)
    l,t,r,b=f.getbbox(text); w,h=r-l+6,b-t+6
    small=Image.new('RGBA',(w,h),(0,0,0,0)); d=ImageDraw.Draw(small)
    d.text((3-l+1,3-t+1),text,font=f,fill=INK+(255,)); d.text((3-l,3-t),text,font=f,fill=(232,226,200,255))
    a=small.split()[3].point(lambda v:255 if v>100 else 0); small.putalpha(a)
    big=small.resize((w*scale,h*scale),Image.NEAREST)
    canvas.alpha_composite(big,((W-big.width)//2,y))
def make(name,bgbox,creatures):
    c=background(f'{R}/clean-valley/clean-valley-2.png',bgbox).convert('RGBA')
    for n,f,x,y in creatures: place(c,creature(n,f),x,y)
    end=title(c)
    tagline(c,'SURVIVE  \u00b7  EVOLVE  \u00b7  LEAVE A LEGACY',H-92)
    c.convert('RGB').save(f'{OUT}/{name}-1260x1000.png')
    c.convert('RGB').resize((630,500),Image.NEAREST).save(f'{OUT}/{name}-630x500.png')
make('cover-a',(165,20,795,520),[('needlejaw-101-d2',12,W*.5,H*.6)])
make('cover-b',(165,40,795,540),[('bankjaw-189-d2',12,W*.5,H*.6)])
make('cover-c',(165,20,795,520),[('rootling-65-d2',8,W*.2,H*.72),('mosskip-223-d2',8,W*.82,H*.7),('needlejaw-101-d2',12,W*.52,H*.56)])
print('ok')
