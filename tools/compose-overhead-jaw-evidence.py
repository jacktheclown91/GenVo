from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
root=Path(__file__).resolve().parents[1];font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',18)
for label in ['before','after']:
 for body in ['tearing-jaw','crushing-jaw','gape-mouth','tusk-jaw']:
    sheet=Image.new('RGB',(4*320,2*348),(12,25,22));draw=ImageDraw.Draw(sheet)
    for direction,name in enumerate(['N','NE','E','SE','S','SW','W','NW']):
        im=Image.open(root/f'docs/overhead-jaws-views-{label}-{body}-{direction}-close-800.png').crop((320,220,480,380)).resize((320,320),Image.Resampling.NEAREST)
        x=direction%4*320;y=direction//4*348;sheet.paste(im,(x,y));draw.text((x+12,y+323),name,font=font,fill=(229,231,206))
    sheet.save(root/f'docs/overhead-jaws-views-{label}-{body}-eight-views.png')
print('Labeled crops from actual game captures, nearest enlarged. Full800 screenshots retained.')
