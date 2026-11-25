% Week 14 · Topic 2 — Stefan–Maxwell equations: A diffusing through a stagnant B + C mixture
% Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
%   dx_B/dz = x_B N_A/(C D_AB),  dx_C/dz = x_C N_A/(C D_AC)  (N_B = N_C = 0)
%   x_B(z) = x_B(L) exp[-N_A(L-z)/(C D_AB)], same for C;  N_A from x_A(0) = 1 - x_B(0) - x_C(0)
function week14_topic2_stefan_maxwell()
  C = 40.9; L = 0.10; DAB = 2.6e-5; DAC = 9.0e-5; xA0 = 0.20; xAL = 0.0;
  fprintf('Topic 2 — Stefan–Maxwell: A through stagnant B + C\n\n');
  fprintf('   C = %g mol/m3, L = %g m, D_AB = %.1e, D_AC = %.1e m2/s, x_A(0) = %g, x_A(L) = 0\n\n', C, L, DAB, DAC, xA0);
  fprintf('[1] Binary check (no C): Stefan–Maxwell versus the log formula\n');
  fprintf('   N_A (Stefan–Maxwell) = %.6e mol/(m2 s)\n', solve_NA(xA0, 1.0, 0.0, L, C, DAB, DAC));
  fprintf('   N_A (log formula)    = %.6e mol/(m2 s)\n\n', C*DAB/L*log((1 - xAL)/(1 - xA0)));
  fprintf('[2] Ternary: top gas is a B + C mixture\n');
  fprintf('    x_C(L)     N_A (mol/m2 s)    D_A,mix at the top (m2/s)\n');
  for xCL = [0.0 0.25 0.5 0.75 1.0]
    xBL = 1 - xCL; N = solve_NA(xA0, xBL, xCL, L, C, DAB, DAC);
    fprintf('    %5.2f      %.4e        %.3e\n', xCL, N, 1/(xBL/DAB + xCL/DAC));
  end
  fprintf('   (Adding the fast partner C raises the flux of A.)\n\n');
  fprintf('[3] Composition profiles for x_C(L) = 0.5\n');
  N = solve_NA(xA0, 0.5, 0.5, L, C, DAB, DAC);
  fprintf('     z/L      x_A       x_B       x_C\n');
  for k = 0:5
    z = L*k/5; xB = 0.5*exp(-N*(L - z)/(C*DAB)); xC = 0.5*exp(-N*(L - z)/(C*DAC));
    fprintf('    %4.1f    %.4f    %.4f    %.4f\n', z/L, 1 - xB - xC, xB, xC);
  end
  fprintf('   B (slow partner) is depleted near the liquid more than C: x_B/x_C is not constant.\n');
end

function N = solve_NA(xA0, xBL, xCL, L, C, DAB, DAC)
  resid = @(N) (1 - xBL*exp(-N*L/(C*DAB)) - xCL*exp(-N*L/(C*DAC))) - xA0;
  lo = 0; hi = 1;
  while resid(hi) < 0, hi = 2*hi; end
  for i = 1:200
    mid = 0.5*(lo + hi);
    if resid(mid) < 0, lo = mid; else, hi = mid; end
  end
  N = 0.5*(lo + hi);
end
