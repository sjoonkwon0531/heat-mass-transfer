% Week 13 · Topic 4 — Two-resistance theory and packed-tower design
% Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
%   1/K_y = 1/k_y + m/k_x;  N = K_y (y - m x)
%   (L/V)_min = (y_b - y_a) / (y_b/m - x_a);  A = L/(mV)
%   NTU_OG = ln[(1 - 1/A)(y_b - m x_a)/(y_a - m x_a) + 1/A] / (1 - 1/A);  Z = HTU_OG × NTU_OG
function week13_topic4_two_film_packed_tower()
  fprintf('Topic 4 — two-resistance theory and packed-tower design\n\n');
  fprintf('[1] Two films in series: k_y = 1e-3, k_x = 5e-3 kmol/(m2 s), y = 0.05, x = 0\n');
  fprintf('        system          m        K_y          gas-film share   y_i       x_i\n');
  names = {'very soluble (NH3-like)', 'moderate', 'sparingly soluble (O2-like)'};
  ms = [0.8 30.0 4.3e4];
  ky = 1e-3; kx = 5e-3; y = 0.05; x = 0;
  for i = 1:3
    m = ms(i); Ky = 1/(1/ky + m/kx); N = Ky*(y - m*x);
    yi = y - N/ky; xi = x + N/kx; share = (1/ky)/(1/Ky);
    fprintf('   %-28s %8.3g   %.3e    %6.2f %%      %.5f   %.3e\n', names{i}, m, Ky, share*100, yi, xi);
  end
  fprintf('   (Small m: gas film controls. Large m: liquid film controls.)\n\n');

  fprintf('[2] Dilute absorber: y_b = 0.020 in, 95%% recovery, clean solvent x_a = 0, m = 1.2\n');
  yb = 0.020; xa = 0.0; m = 1.2; ya = yb*(1 - 0.95);
  LVmin = (yb - ya)/(yb/m - xa);
  fprintf('   y_a = %.4f,  (L/V)_min = %.4f\n', ya, LVmin);
  for f = [1.1 1.5 2.0 3.0]
    LV = f*LVmin; A = LV/m; xb = xa + (yb - ya)/LV;
    fprintf('   L/V = %.1f×min = %.4f   A = %.3f   x_b = %.5f   NTU_OG = %.3f (numerical %.3f)\n', ...
            f, LV, A, xb, ntu_colburn(yb, ya, xa, LV, m), ntu_numeric(yb, ya, xa, LV, m));
  end
  fprintf('\n');
  fprintf('[3] Height: G_M = 0.020 kmol/(m2 s), K_y a = 0.040 kmol/(m3 s)  ->  HTU_OG = 0.50 m\n');
  HTU = 0.020/0.040;
  for f = [1.1 1.5 2.0]
    fprintf('   L/V = %.1f×min   Z = HTU × NTU = %.2f m\n', f, HTU*ntu_colburn(yb, ya, xa, f*LVmin, m));
  end
end

function n = ntu_colburn(yb, ya, xa, LV, m)
  A = LV/m;
  n = log((1 - 1/A)*(yb - m*xa)/(ya - m*xa) + 1/A)/(1 - 1/A);
end

function s = ntu_numeric(yb, ya, xa, LV, m)
  N = 20000; yy = linspace(ya, yb, N + 1);
  xx = xa + (yy - ya)/LV;
  s = trapz(yy, 1./(yy - m*xx));
end
