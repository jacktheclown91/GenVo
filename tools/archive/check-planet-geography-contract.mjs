import fs from 'node:fs';
import assert from 'node:assert/strict';
const directory='docs/living-planet-architecture',c=JSON.parse(fs.readFileSync(`${directory}/planet-geography-contract.json`));
assert.equal(c.status,'REVIEW_REQUIRED_NOT_RUNTIME_CONFIGURATION');assert.equal(c.worldSizeExpansionAuthorized,false);
assert.deepEqual(c.initialDetailedExtentTiles,[128,128]);assert.equal(c.pageSizeTiles,64);
const phi0=c.exampleAnchorDegrees.latitude*Math.PI/180,lambda0=c.exampleAnchorDegrees.longitude*Math.PI/180;
const sample=(x,y)=>({latitude:phi0-2*Math.PI*y/c.equatorialCircumferenceTiles,longitude:lambda0+2*Math.PI*x/(c.equatorialCircumferenceTiles*Math.cos(phi0))});
const rows=[128,256].map(width=>({widthTiles:width,latitudeSpanDegrees:width*360/c.equatorialCircumferenceTiles,longitudeSpanDegrees:width*360/(c.equatorialCircumferenceTiles*Math.cos(phi0)),fractionOfEquator:width/c.equatorialCircumferenceTiles}));
assert.equal(rows[1].fractionOfEquator,1/4096);assert.ok(rows[1].latitudeSpanDegrees<.1);
for(const [x,y] of [[-1,-1],[63,64],[64,63],[128,128]]){const cx=Math.floor(x/64),cy=Math.floor(y/64),lx=x-cx*64,ly=y-cy*64;assert.ok(lx>=0&&lx<64&&ly>=0&&ly<64);assert.equal(cx*64+lx,x);assert.equal(cy*64+ly,y);const direct=sample(x,y),viaPage=sample(cx*64+lx,cy*64+ly);assert.deepEqual(direct,viaPage)}
const receipt={scope:'Static proposal arithmetic and page-coordinate reconstruction only; not a terrain generator, runtime geography, hydrology or performance acceptance.',status:'PASS',descriptor:c,macroCells:c.macroWidth*c.macroHeight,equatorialTilesPerMacroColumn:c.equatorialCircumferenceTiles/c.macroWidth,rows};
fs.writeFileSync(`${directory}/planet-geography-contract-check.json`,JSON.stringify(receipt,null,2));console.log(JSON.stringify({status:receipt.status,rows}));
