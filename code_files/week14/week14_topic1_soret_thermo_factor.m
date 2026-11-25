% Week 14 · Topic 1 — Coupled fluxes: Soret separation and the thermodynamic factor
% Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
%   x_A(L) - x_A(0) ≈ -x_A x_B alpha_A ln(T_L/T_0);  exact: dx/dlnT = -alpha x(1-x)
%   Margules: D* = (1 - 2 A x1 x2) D, negative (uphill diffusion) only if A > 2
function week14_topic1_soret_thermo_factor()
  shift = @(xA, al, TL, T0) -xA*(1 - xA)*al*log(TL/T0);
  fprintf('Topic 1 — Soret separation and the thermodynamic factor\n\n');
  fprintf('[1] Lecture example: alpha_A = 0.3, T_L = 300 K, T_0 = 200 K, x_A = x_B = 0.5\n');
  r = 0.5/0.5*(200/300)^0.3; ex = r/(1 + r) - 0.5;
  fprintf('   linearised x_A(L) - x_A(0) = %+.4f\n', shift(0.5, 0.3, 300, 200));
  fprintf('   exact (integrated)         = %+.4f\n', ex);
  fprintf('   Sign: with alpha_A > 0 the heavier species A gathers at the cold wall (y = 0).\n\n');
  fprintf('[2] Effect of the temperature ratio (alpha_A = 0.3, x_A = 0.5)\n');
  for ratio = [1.1 1.5 2.0 3.0 5.0]
    fprintf('   T_L/T_0 = %4.1f   shift = %+.4f\n', ratio, shift(0.5, 0.3, ratio, 1.0));
  end
  fprintf('\n[3] Cascade: separation factor per stage q = (T_L/T_0)^alpha, n stages -> q^n\n');
  q = 1.5^0.3;
  for n = [1 5 10 20 50]
    fprintf('   n = %3d   q^n = %10.3f\n', n, q^n);
  end
  fprintf('   (This is why thermal diffusion columns can separate isotopes despite a tiny alpha.)\n\n');
  fprintf('[4] Thermodynamic factor 1 + dln(gamma)/dln(x) for a Margules solution\n');
  fprintf('     x1      A=0.5     A=1.5     A=2.5\n');
  tf = @(x, A) 1 - 2*A*x*(1 - x);
  for x = [0.1 0.2 0.3 0.4 0.5]
    fprintf('   %5.2f   %7.3f   %7.3f   %7.3f\n', x, tf(x, 0.5), tf(x, 1.5), tf(x, 2.5));
  end
  A = 2.5; xs = 0.5*(1 - sqrt(1 - 2/A));
  fprintf('   For A = %g: D* < 0 for %.3f < x1 < %.3f (spinodal region, uphill diffusion)\n', A, xs, 1 - xs);
end
