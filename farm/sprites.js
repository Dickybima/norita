// 16×16 pixel-art sprites for the crops, turned into image URLs at load.
// Use window.FARM_SPRITES[name] as an <img> src (with image-rendering: pixelated).
(() => {
  const PAL = {
    l: "#8bd84a", g: "#4caf3a", G: "#2e7d32",
    w: "#f5f0e6", p: "#b0457b", k: "#3a2414",
    b: "#b07a3c", B: "#7a4f22",
    y: "#f7d23e", Y: "#d19a1d",
    r: "#e0362c", R: "#a3201a",
    o: "#f08a24", O: "#c25e12", s: "#fff4c8",
  };

  const SPRITES = {
    sprout: [
      "................", "................", "................", "................",
      "................", "................", "................", "................",
      "................", ".....ll...ll....", "....lggl.lggl...", ".....lggggl.....",
      ".......gg.......", ".......gg.......", ".......GG.......", "................",
    ],
    young: [
      "................", "................", "................", "................",
      "................", "....ll.....ll...", "...lggl...lggl..", "...lgggl.lgggl..",
      "....lgggggggl...", ".....lgggggl....", "..ll...ggg...ll.", ".lggl..ggg..lggl",
      "..lgggggggggggl.", "....lgggGgggl...", "......GGGG......", "................",
    ],
    turnip: [
      "................", "..gg...gg...gg..", "..glg.glg..glg..", "...glgglg.glg...",
      "....gggggggg....", "......GGGG......", ".....pppppp.....", "....pppppppp....",
      "...ppsspppppp...", "...wswwwwwwww...", "...wwwwwwwwwk...", "....wwwwwwwk....",
      ".....wwwwwk.....", "......wwkk......", ".......k........", "................",
    ],
    potato: [
      "................", "................", ".....g...g......", "....glg.glg.....",
      ".....ggggg......", ".......G........", "....bbbbbb......", "...bbbbbbbbb....",
      "..bbBbbbbbbbb...", "..bsbbbbbBbbbb..", "..bbbbbbbbbbbb..", "...bbbBbbbbbbk..",
      "....bbbbbbbbk...", ".....kkkkkkk....", "................", "................",
    ],
    corn: [
      "........l.......", ".......lg.......", ".......yy.......", "......yYyy......",
      "......ysYy......", "..g...yYyy...g..", "..gg..yyYy..gg..", "...gg.yYyy.gg...",
      "....ggyyYygg....", ".....gyYyyg.....", ".....ggyyYg.....", "......ggggg.....",
      ".......gg.......", ".......gG.......", ".......GG.......", "................",
    ],
    tomato: [
      "................", ".......g........", "......ggg.......", "..g..gGgGg..g...",
      "..gg.ggGgg.gg...", "...gggrrggggg...", "...grrrrRgg.....", "...rrsrrrRg.....",
      "...rrrrrrR..rr..", "....rrrrR..rrrR.", "......g...rsrrR.", ".....ggg..rrrR..",
      "......G....RR...", "......G.........", "......GG........", "................",
    ],
    pumpkin: [
      "................", ".......BB.......", "........B.gg....", "........Bgg.....",
      "....ooOooOoo....", "...oooOooOooo...", "..oosoOooOoooo..", "..ooooOooOoooO..",
      "..ooooOooOoooO..", "..ooooOooOoooO..", "..OoooOooOoooO..", "...OooOooOooO...",
      "....OOOOOOOO....", "................", "................", "................",
    ],
  };

  const out = {};
  for (const [name, rows] of Object.entries(SPRITES)) {
    const c = document.createElement("canvas");
    c.width = c.height = 16;
    const x = c.getContext("2d");
    rows.forEach((row, y) => [...row.padEnd(16, ".").slice(0, 16)].forEach((ch, i) => {
      if (PAL[ch]) { x.fillStyle = PAL[ch]; x.fillRect(i, y, 1, 1); }
    }));
    out[name] = c.toDataURL();
  }
  window.FARM_SPRITES = out;
})();
