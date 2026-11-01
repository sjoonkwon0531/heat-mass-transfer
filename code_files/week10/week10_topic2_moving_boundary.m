% Week 10 - Topic 2: Pseudo-Steady Moving Boundaries: Si Oxidation and Carbon-Particle Burnout
% Lecture (Part 1):
%   * diffusion-controlled Si oxidation (O2 = A through SiO2 = B, c_A = 0 at the Si interface):
%       N_Az = D c_As/delta(t);  (rho_B/M_B) d(delta)/dt = N_Az
%       -> delta(t) = (2 M_B D c_As t / rho_B)^(1/2)          (parabolic law)
%     with a finite interface reaction N_Az = k_s c_Ai added in series (linear-parabolic form):
%       delta^2 + (2D/k_s) delta = (2 M_B D c_As/rho_B) t
%   * carbon sphere burning in still air: 3C + 2.5 O2 -> 2 CO2 + CO  (A = O2)
%       sum N = -0.2 N_A  ->  N_Ar = -(c D/(1 + 0.2 y_A)) dy_A/dr,   r^2 N_Ar = const
%       W_O2 = -4 pi R (c D/0.2) ln(1.042)      (y_A = 0 at r = R, 0.21 at infinity)
%       W_C = (3/2.5)|W_O2| = 12 pi R (c D/0.5) ln(1.042)
%       t_f = (rho_C/M_C)(R0^2 - Rf^2) / (12 c D ln 1.042)
%   * single heterogeneous reaction C + O2 -> CO2 with surface rate N_A = -k_s c_As:
%       W_O2 = -4 pi R c D y_inf / (1 + D/(k_s R))
% Parameter values below are illustrative (labelled where chosen).
function week10_topic2_moving_boundary()
    R = 8.314462618; M = 60.08e-3; rho = 2270; cs = 5.2e16*1e6/6.02214076e23; Dox = 3.4e-13;
    dpar = @(t) sqrt(2*M*Dox*cs*t/rho);
    dlp = @(t, ks) 0.5*(-2*Dox/ks + sqrt((2*Dox/ks)^2 + 4*(2*M*Dox*cs/rho)*t));
    fprintf('c_As = %.4e mol/m^3\n', cs);
    fprintf('  t (h)   parabolic (um)   linear-parabolic ks=1e-5 m/s (um)   numeric (um)\n');
    for h = [1 2 4 8 16]
        t = h*3600; n = 40000; dt = t/n; d = 1e-10;
        for i = 1:n, d = d + M/rho*cs/(d/Dox + 1/1e-5)*dt; end
        fprintf('%6d   %12.4f   %22.4f   %16.4f\n', h, dpar(t)*1e6, dlp(t, 1e-5)*1e6, d*1e6);
    end
    burn = @(R0, T) (2000/0.012)*R0^2/(12*(101325/(R*T))*2e-4*log(1.042));
    fprintf('\nCarbon sphere, T = 1200 K, D = 2.0e-4 m^2/s (illustrative), rho_C = 2000 kg/m^3\n');
    fprintf('  ln(1.042)/0.2 = %.5f vs 0.21 (no bulk-flow correction)\n', log(1.042)/0.2);
    for r = [10 50 100], fprintf('  R0 = %4d um -> burnout time %.4f s\n', r, burn(r*1e-6, 1200)); end
    fprintf('  burnout time scales as R0^2: 100 um vs 10 um -> %.1f\n', burn(100e-6,1200)/burn(10e-6,1200));
    W = @(Rp, T, ks) -4*pi*Rp*(101325/(R*T))*2e-4*0.21/(1 + 2e-4/(ks*Rp));
    fprintf('\nSingle heterogeneous reaction C + O2 -> CO2, R = 50 um, T = 1200 K\n');
    Rp = 50e-6; Wd = W(Rp, 1200, 1e9);
    for ks = [0.1 1 10 100]
        w = W(Rp, 1200, ks);
        fprintf('  k_s = %6.1f m/s, Da = k_s R/D = %7.3f: W_O2 = %.4e mol/s (%5.1f%% of diffusion limit)\n', ks, ks*Rp/2e-4, w, w/Wd*100);
    end
end
