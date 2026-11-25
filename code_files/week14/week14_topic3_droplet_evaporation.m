% Week 14 · Topic 3 — Simultaneous heat and mass transfer: a water droplet evaporating in N2
% Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
%   (1 - x_inf)/(1 - x_R) = [1 + c_pW (T_inf - T_R)/lambda]^(a*),  a* = k_G/(C c_pW D),  x_R = p_sat(T_R)/P
%   d^2 law: t_life = C_L R0^2 / (2 C D ln[(1 - x_inf)/(1 - x_R)])
function week14_topic3_droplet_evaporation()
  P = 101325; RG = 8.314; kG = 0.026; D = 2.6e-5; cpW = 34.0; lam = 44000; CL = 55500;
  C = P/(RG*298.15);
  fprintf('Topic 3 — water droplet evaporating in N2 (pseudo-steady, stagnant gas)\n\n');
  fprintf('   k_G = %g, D = %.1e, c_pW = %.1f, lambda = %.0f J/mol, C = %.2f mol/m3\n', kG, D, cpW, lam, C);
  fprintf('   a* = k_G/(C c_pW D) = %.3f\n\n', kG/(C*cpW*D));
  fprintf('[1] Surface temperature and vapor fraction (dry N2, x_W,inf = 0)\n');
  fprintf('   T_inf (C)   T(R) (C)   x_W(R)     lifetime of a 100 um droplet (s)\n');
  for Tinf = [25 50 100 150 200]
    [TR, xR] = surface_state(Tinf, 0.0);
    tl = CL*(50e-6)^2/(2*C*D*log(1/(1 - xR)));
    fprintf('   %7.0f    %8.2f   %.5f    %8.2f\n', Tinf, TR, xR, tl);
  end
  fprintf('\n[2] Humid gas at 25 C: the surface warms toward T_inf as x_W,inf rises\n');
  for xi = [0.0 0.01 0.02 0.03]
    [TR, xR] = surface_state(25.0, xi);
    fprintf('   x_W,inf = %.2f   T(R) = %6.2f C   x_W(R) = %.5f\n', xi, TR, xR);
  end
  fprintf('\n[3] d^2 law: t_life ∝ R0^2 (dry N2, 25 C)\n');
  [~, xR] = surface_state(25.0, 0.0);
  for d = [10 50 100 500]
    R0 = d*0.5e-6;
    fprintf('   d0 = %4d um   t_life = %10.3f s\n', d, CL*R0^2/(2*C*D*log(1/(1 - xR))));
  end

  function [TR, xR] = surface_state(Tinf, xinf)
    a = kG/(C*cpW*D);
    f = @(T) log((1 - xinf)/(1 - psat(T)/P)) - a*log(1 + cpW*(Tinf - T)/lam);
    lo = -40; hi = min(Tinf, 99.9);
    for i = 1:200
      mid = 0.5*(lo + hi);
      if f(lo)*f(mid) <= 0, hi = mid; else, lo = mid; end
    end
    TR = 0.5*(lo + hi); xR = psat(TR)/P;
  end
end

function p = psat(Tc)
  p = 611.21*exp((18.678 - Tc/234.5)*(Tc/(257.14 + Tc)));
end
