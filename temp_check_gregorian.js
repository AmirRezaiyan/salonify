function toGregorian(jy, jm, jd) {
  let gy, gm, gd;
  jy += 1595;
  let days = -355779 + 365*jy + Math.floor(jy/33)*8 + Math.floor(((jy%33)+3)/4) + (jm<=6 ? (jm-1)*31 : (jm-7)*30+186);
  const jy2 = jy - 979;
  const jm2 = jm - 1;
  const jd2 = jd - 1;
  let j_day_no = 365*jy2 + Math.floor(jy2/33)*8 + Math.floor((jy2%33+3)/4);
  for (let i = 0; i < jm2; ++i) j_day_no += [31,31,31,31,31,31,30,30,30,30,30,29][i];
  j_day_no += jd2;
  let g_day_no = j_day_no + 79;
  let gy2 = 1600 + 400 * Math.floor(g_day_no / 146097);
  g_day_no %= 146097;
  let leap = true;
  if (g_day_no >= 36525) {
    g_day_no--;
    gy2 += 100 * Math.floor(g_day_no / 36524);
    g_day_no %= 36524;
    if (g_day_no >= 365) g_day_no++;
    else leap = false;
  }
  gy2 += 4 * Math.floor(g_day_no / 1461);
  g_day_no %= 1461;
  if (g_day_no >= 366) {
    leap = false;
    g_day_no--;
    gy2 += Math.floor(g_day_no / 365);
    g_day_no %= 365;
  }
  const g_d_no = [31, leap ? 29 : 28, 31,30,31,30,31,31,30,31,30,31];
  let gm2;
  for (gm2 = 0; g_day_no >= g_d_no[gm2]; gm2++) g_day_no -= g_d_no[gm2];
  return new Date(gy2, gm2, g_day_no + 1);
}
console.log('1405/4/15 ->', toGregorian(1405,4,15).toISOString());
console.log('1405/5/1 ->', toGregorian(1405,5,1).toISOString());
