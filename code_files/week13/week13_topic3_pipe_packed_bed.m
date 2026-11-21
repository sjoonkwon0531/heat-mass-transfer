% Week 13 · Topic 3 — Confined flows: pipes and packed beds
% Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
%   Gilliland & Sherwood: Sh (p_B,lm/P) = 0.023 Re^0.83 Sc^0.44;  Linton & Sherwood: Sh = 0.023 Re^0.83 Sc^(1/3)
%   Laminar tube: Sh = 1.86 (Re Sc d/L)^(1/3);  packed bed: j_D = 1.17 Re^-0.415
%   Wilson & Geankoplis (liquids): eps j_D = 1.09 Re^(-2/3) (Re < 55), 0.250 Re^(-0.31) (55 < Re < 1500)
function week13_topic3_pipe_packed_bed()
  fprintf('Topic 3 — pipes and packed beds\n\n');
  fprintf('[1] Water evaporating into air in a wetted-wall tube (d = 2.5 cm, v = 3 m/s, 25 C)\n');
  d = 0.025; v = 3.0; nu = 1.55e-5; D = 2.6e-5; Re = v*d/nu; Sc = nu/D;
  Sh = 0.023 * Re^0.83 * Sc^0.44;
  fprintf('   Re = %.0f, Sc = %.3f, Sh = %.2f, k_c = %.4f m/s  (p_B,lm/P taken as 1)\n\n', Re, Sc, Sh, Sh*D/d);

  fprintf('[2] Benzoic acid lining a pipe, water flow (d = 2.5 cm, Re = 1e4, Sc = 1000, D = 1e-9 m2/s)\n');
  Sh = 0.023 * 1e4^0.83 * 1000^(1/3);
  fprintf('   Linton-Sherwood: Sh = %.1f, k_c = %.3e m/s\n\n', Sh, Sh*1e-9/0.025);

  fprintf('[3] Laminar tube, Re = 500, Sc = 1000: effect of the length\n');
  for Ld = [10 100 1000]
    fprintf('   L/d = %5d   Sh = %.2f\n', Ld, 1.86 * (500*1000/Ld)^(1/3));
  end
  fprintf('   (Longer tubes give a smaller mean Sh: the concentration layer keeps thickening.)\n\n');

  fprintf('[4] Water through a bed of benzoic acid spheres (d_p = 6 mm, v'' = 1 mm/s, eps = 0.40, Sc = 1000)\n');
  dp = 6e-3; vs = 1e-3; nu = 8.9e-7; eps = 0.40; Sc = 1000.0; D = 8.9e-10;
  Re = dp*vs/nu; ej = eps_jD_wilson(Re); jD = ej/eps; kc = jD*vs/Sc^(2/3);
  fprintf('   Re = %.2f  ->  eps j_D = %.4f, j_D = %.4f, k_c = %.3e m/s\n', Re, ej, jD, kc);
  fprintf('   Sh = k_c d_p / D = %.2f\n', kc*dp/D);
  fprintf('   continuity check at Re = 55: %.4f vs %.4f\n\n', 1.09*55^(-2/3), 0.250*55^-0.31);

  fprintf('[5] Gas through a packed bed: j_D = 1.17 Re^-0.415\n');
  for Re = [10 100 1000 2500]
    fprintf('   Re = %5d   j_D = %.4f\n', Re, 1.17*Re^-0.415);
  end
end

function e = eps_jD_wilson(Re)
  if Re < 55, e = 1.09 * Re^(-2/3); else, e = 0.250 * Re^-0.31; end
end
