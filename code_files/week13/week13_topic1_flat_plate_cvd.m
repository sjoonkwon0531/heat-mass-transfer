% Week 13 · Topic 1 — Flat-plate correlations, the unheated starting length, and the CVD example
% Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
%   Laminar (Re_L < 2e5):   Sh_L = 0.664 Re_L^(1/2) Sc^(1/3)
%   Turbulent (Re_L > 2e5): Sh_L = 0.0365 Re_L^(4/5) Sc^(1/3)
%   Wall active from x = X: Sh_x = 0.332 Re_x^(1/2) [Sc / (1 - (X/x)^(3/4))]^(1/3)
function week13_topic1_flat_plate_cvd()
  fprintf('Topic 1 — flat-plate correlations and the CVD example\n\n');
  fprintf('[1] Mean Sh and j_D on a flat plate (Sc = 1)\n');
  fprintf('   Re_L       regime      Sh_L        j_D\n');
  for Re = [1e3 1e4 1e5 1.99e5 2.01e5 1e6 1e7]
    if Re < 2e5, reg = 'laminar'; else, reg = 'turbulent'; end
    fprintf('   %8.2e  %-10s %10.2f  %.5f\n', Re, reg, sh_plate_mean(Re, 1.0), jD_plate(Re));
  end
  fprintf('   (Check: j_D = Sh / (Re Sc^(1/3)) equals C_f/2 for a flat plate.)\n\n');

  fprintf('[2] Entrance (unheated starting length) factor [1 - (X/x)^(3/4)]^(-1/3)\n');
  for r = [0.0 0.2 0.44444 0.6 0.8 0.9 0.99]
    fprintf('   X/x = %6.4f   factor = %6.3f\n', r, (1 - r^0.75)^(-1/3));
  end
  fprintf('\n');

  fprintf('[3] CVD example: v = 100 cm/s, nu = 5.686 cm2/s, D_AB = 1.55 cm2/s, X = 4 cm, x = 9 cm\n');
  v = 100.0; nu = 5.686; D = 1.55; X = 4.0; x = 9.0;
  Re = v * x / nu; Sc = nu / D;
  ratio = (Sc / (1 - (X/x)^0.75))^(1/3);
  Sh = 0.332 * sqrt(Re) * ratio; kc = Sh * D / x;
  fprintf('   Re_x = %.1f (laminar),  Sc = %.3f\n', Re, Sc);
  fprintf('   entrance factor (Sc/(1-(X/x)^0.75))^(1/3) = %.3f\n', ratio);
  fprintf('   Sh_x = %.3f   ->   k_c = Sh D / x = %.3f cm/s\n', Sh, kc);
  dM = 4.79 * x / sqrt(Re); dc = dM / ratio; kf = D / dc;
  fprintf('   delta_M = 4.79 x / Re^(1/2) = %.3f cm,  delta_M/delta_c = %.3f,  delta_c = %.3f cm\n', dM, ratio, dc);
  fprintf('   film theory k_c = D/delta_c = %.3f cm/s   (%.0f%% below the BL result)\n', kf, (1 - kf/kc) * 100);
  fprintf('   with the cubic-profile wall gradient 3/2: k_c = 1.5 D/delta_c = %.3f cm/s\n', 1.5 * kf);
end

function s = sh_plate_mean(Re, Sc)
  if Re < 2e5, s = 0.664 * Re^0.5 * Sc^(1/3); else, s = 0.0365 * Re^0.8 * Sc^(1/3); end
end

function j = jD_plate(Re)
  if Re < 2e5, j = 0.664 * Re^-0.5; else, j = 0.0365 * Re^-0.2; end
end
