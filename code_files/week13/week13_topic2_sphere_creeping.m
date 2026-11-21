% Week 13 · Topic 2 — Creeping flow past a sphere: Stokes drag, terminal velocity, and Sh(Pe)
% Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
%   F_D = 6 pi mu U R,  U_T = 2 R^2 (rho_p - rho) g / (9 mu)
%   Pe << 1 (Acrivos & Taylor, Pe = U R / D): Sh = 2[1 + Pe/4 + (Pe^2/8) ln Pe + 0.01702 Pe^2 + (Pe^3/32) ln Pe]
%   Pe >> 1: Sh = 1.249 Pe^(1/3);  Brian & Hales: Sh = (4 + 1.21 Pe_d^(2/3))^(1/2);  Froessling: Sh = 2 + 0.552 Re^(1/2) Sc^(1/3)
function week13_topic2_sphere_creeping()
  g = 9.81;
  fprintf('Topic 2 — creeping flow past a sphere\n\n');
  fprintf('[1] Stokes terminal velocity  U_T = 2 R^2 (rho_p - rho) g / (9 mu)\n');
  names = {'1 um silica in water (CMP slurry)', '10 um water droplet in air', '100 um sand grain in water'};
  P = [0.5e-6, 2200-997, 8.9e-4, 997; 5e-6, 1000-1.18, 1.8e-5, 1.18; 50e-6, 2650-997, 8.9e-4, 997];
  for i = 1:3
    R = P(i,1); drho = P(i,2); mu = P(i,3); rho = P(i,4);
    U = 2 * R^2 * drho * g / (9 * mu); Re = rho * U * 2 * R / mu; F = 6 * pi * mu * U * R;
    fprintf('   %-34s U_T = %.3e m/s   Re = %.2e   F_D = %.3e N\n', names{i}, U, Re, F);
  end
  fprintf('   (Stokes'' law needs Re << 1; the 100 um grain is already at Re ~ 1, the edge of validity.)\n\n');

  fprintf('[2] Sherwood number of a sphere versus Pe = U R / D   (Sh based on the diameter)\n');
  fprintf('     Pe       Acrivos-Taylor   1.249 Pe^(1/3)   Brian-Hales(Pe_d = 2 Pe)\n');
  for Pe = [0.01 0.1 0.5 1 10 100 1000 1e4]
    if Pe <= 1
      L = log(Pe); st = 2 * (1 + Pe/4 + Pe^2/8*L + 0.01702*Pe^2 + Pe^3/32*L);
    else
      st = NaN;
    end
    fprintf('   %7.2g   %12.4f   %12.3f   %12.3f\n', Pe, st, 1.249 * Pe^(1/3), sqrt(4 + 1.21 * (2*Pe)^(2/3)));
  end
  fprintf('   Same law in two notations: 1.249 Pe^(1/3) = 1.249 (Pe_d/2)^(1/3) = %.3f Pe_d^(1/3)\n\n', 1.249 / 2^(1/3));

  fprintf('[3] Shape factors for Pe << 1 (Sh on length L)\n');
  fprintf('   %-36s Sh = %.3f\n', 'sphere, L = 2R', 2.0);
  fprintf('   %-36s Sh = %.3f\n', 'oblate spheroid a/b = 1/2, L = 2b', 2.40);
  fprintf('   %-36s Sh = %.3f\n', 'circular disk, L = 2R', 8/pi);
  fprintf('   %-36s Sh = %.3f\n', 'square plate, L = a', pi/log(4));
  fprintf('\n');

  fprintf('[4] Froessling: 1 mm naphthalene sphere in air at 1 m/s (nu = 1.55e-5, D = 6.1e-6 m2/s)\n');
  d = 1e-3; U = 1.0; nu = 1.55e-5; D = 6.1e-6;
  Re = U * d / nu; Sc = nu / D; Sh = 2 + 0.552 * sqrt(Re) * Sc^(1/3);
  fprintf('   Re = %.1f, Sc = %.3f, Sh = %.3f, k_c = %.4f m/s\n', Re, Sc, Sh, Sh * D / d);
end
