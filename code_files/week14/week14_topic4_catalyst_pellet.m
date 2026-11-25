% Week 14 · Topic 4 — Mass transfer for reaction engineering: external film, packed bed, Thiele modulus
% Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
%   Sh = 2 + 0.6 Re^(1/2) Sc^(1/3);  r'' = k_r k_c c_Ab/(k_r + k_c);  c_A/c_A0 = exp(-k_c a_c z/U)
%   eta = (3/phi^2)(phi coth phi - 1);  Omega = eta/(1 + eta k/(k_c a_c))
function week14_topic4_catalyst_pellet()
  kcf = @(U) (2 + 0.6*sqrt(U*0.01/5e-7)*(5e-7/1e-10)^(1/3))*1e-10/0.01;
  fprintf('Topic 4 — external film, packed bed, and internal diffusion\n\n');
  fprintf('[1] Lecture example: d_p = 1 cm, U = 0.1 m/s, D_AB = 1e-10 m2/s, nu = 5e-7 m2/s, c_Ab = 1 mol/L\n');
  Re = 0.1*0.01/5e-7; Sc = 5e-7/1e-10; Sh = 2 + 0.6*sqrt(Re)*Sc^(1/3); kc = Sh*1e-10/0.01;
  fprintf('   Re = %.0f, Sc = %.0f, Sh = %.1f, k_c = %.3e m/s\n', Re, Sc, Sh, kc);
  fprintf('   instantaneous surface reaction: n_A = k_c c_Ab = %.3e mol/(m2 s)\n\n', kc*1000);
  fprintf('[2] Finite surface rate: Da = k_r/k_c\n');
  for Da = [0.01 0.1 1 10 100]
    kr = Da*kc;
    fprintf('   Da = %7.2f   c_As/c_Ab = %.4f   rate = %.3e mol/(m2 s)\n', Da, kc/(kr + kc), kr*kc/(kr + kc)*1000);
  end
  fprintf('   (Da << 1: reaction-limited; Da >> 1: transport-limited.)\n\n');
  fprintf('[3] Sensitivity of k_c in the transport-limited regime (Sh >> 2): k_c ∝ U^(1/2) d_p^(-1/2) D^(2/3) nu^(-1/6)\n');
  for U = [0.05 0.1 0.2 0.4]
    fprintf('   U = %.2f m/s   k_c = %.3e m/s\n', U, kcf(U));
  end
  fprintf('\n[4] Mass-transfer-limited packed bed (d_p = 1 cm, bed porosity 0.4, U = 0.1 m/s superficial)\n');
  ac = 6*(1 - 0.4)/0.01;
  for z = [0.1 0.5 1.0 2.0 5.0]
    r = exp(-kc*ac*z/0.1);
    fprintf('   z = %4.1f m   c_A/c_A0 = %.4f   conversion = %.4f\n', z, r, 1 - r);
  end
  fprintf('   a_c = %.0f m2/m3\n\n', ac);
  fprintf('[5] Internal effectiveness factor of a sphere\n');
  fprintf('      phi1      eta        3/phi1\n');
  for p = [0.1 0.5 1 2 5 10 20]
    fprintf('   %7.2f   %.4f    %.4f\n', p, eta_sphere(p), 3/p);
  end
  fprintf('\n[6] Overall effectiveness Omega with the external film (k = 2e-3 1/s, k_c a_c from [1] and [4])\n');
  kbed = 2e-3;
  for p = [0.5 2 10]
    eta = eta_sphere(p); Om = eta/(1 + eta*kbed/(kc*ac));
    fprintf('   phi1 = %5.1f   eta = %.4f   k_c a_c = %.3e 1/s   Omega = %.4e\n', p, eta, kc*ac, Om);
  end
end

function e = eta_sphere(phi)
  if phi < 1e-4, e = 1; else, e = 3/phi^2*(phi/tanh(phi) - 1); end
end
