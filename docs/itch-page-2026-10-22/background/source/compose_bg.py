# GenVo itch.io page background (2026-10-22) from genuine, UI-free frames of
# the shipped Day-100 valley read from the game's own canvas. Pixels are
# scaled only by whole-number nearest-neighbour factors. The image is dimmed
# for readability, darkest behind itch.io's centred content column, and its
# bottom fades into the page colour #13241F so it can be set to no-repeat.
import sys
from PIL import Image, ImageDraw, ImageEnhance
SRC,OUT=sys.argv[1],sys.argv[2]
BASE=(19,36,31)
def finish(img,name):
    W,H=img.size
    img=ImageEnhance.Color(img).enhance(.85); img=ImageEnhance.Brightness(img).enhance(.56)
    mask=Image.new('L',(W,H),0); d=ImageDraw.Draw(mask)
    col=W//4  # half-width of the darkened column band
    for x in range(W):
        t=max(0,1-abs(x-W/2)/(col*1.35)); a=int(150*min(1,t*1.25))
        d.line((x,0,x,H),fill=a)
    img=Image.composite(Image.new('RGB',(W,H),BASE),img,mask)
    fade=Image.new('L',(W,H),0); d=ImageDraw.Draw(fade)
    for y in range(H):
        a=0
        if y>H*.62:a=int(255*((y-H*.62)/(H*.38))**1.3)
        if y<H*.08:a=max(a,int(120*(1-y/(H*.08))))
        d.line((0,y,W,y),fill=min(255,a))
    img=Image.composite(Image.new('RGB',(W,H),BASE),img,fade)
    img.save(f'{OUT}/{name}.png')
    # mock of the itch.io page: 960-wide column scaled to the image width
    mock=img.copy(); md=ImageDraw.Draw(mock,'RGBA'); cw=int(W*960/1920)
    md.rectangle(((W-cw)//2,int(H*.05),(W+cw)//2,H),fill=(38,53,31,255))
    mock.resize((960,int(960*H/W))).save(f'{OUT}/{name}-mock.png')
    return img
a=Image.open(f'{SRC}/clean-valley/clean-valley-2.png').convert('RGB').resize((1920,1080),Image.NEAREST)
finish(a,'background-1920x1080')
b=Image.open(f'{SRC}/bg-valley/bg-valley-2.png').convert('RGB')
b=b.crop((240,300,1520,1020)).resize((2560,1440),Image.NEAREST)
finish(b,'background-2560x1440')
print('ok')
