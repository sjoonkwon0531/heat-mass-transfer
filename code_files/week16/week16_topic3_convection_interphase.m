% Week 16 · Topic 3 — Final review: convective mass transfer, correlations, interphase transfer
% Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
%   flat plate: Sh_L = 0.664 Re^1/2 Sc^1/3 (Re_L < 2e5), 0.0365 Re^4/5 Sc^1/3 (turbulent)
%   sphere (Frossling, Week 13): Sh = 2 + 0.552 Re^1/2 Sc^1/3, 2 < Re < 800, 0.6 < Sc < 2.7
%   pipe (liquid, turbulent): Sh = 0.023 Re^0.8 Sc^1/3 (Week 12 example)
%   two films: 1/Ky = 1/ky + m/kx;  absorber: NTU_OG = ln[(1 - 1/A)(yb - m xa)/(ya - m xa) + 1/A]/(1 - 1/A)
function week16_topic3_convection_interphase()
    fprintf('Topic 3 — convection, correlations and interphase transfer\n\n');
    fprintf('[1] Flat plates in air at 25 C (nu = 1.55e-5 m2/s)\n');
    cases = {2.0, 0.3, 2.6e-5, 'water vapour'; 5.0, 0.3, 6.1e-6, 'naphthalene'; 15.0, 1.0, 6.1e-6, 'naphthalene'};
    for i = 1:3
        [Re, Sc, Sh, kc, reg] = flat_plate(cases{i,1}, cases{i,2}, 1.55e-5, cases{i,3});
        fprintf('   %-12s U = %4.1f m/s, L = %.1f m: Re = %.3e (%s), Sc = %.3f, Sh = %.1f, k_c = %.3e m/s\n', cases{i,4}, cases{i,1}, cases{i,2}, Re, reg, Sc, Sh, kc);
    end
    [~, ~, ~, kc] = flat_plate(2.0, 0.3, 1.55e-5, 2.6e-5);
    fprintf('   evaporation (first case, rho_v,s = 0.0230 kg/m3): %.3f kg/m2 h\n\n', kc*0.0230*3600);
    Re = 1.0*0.01/1.55e-5; Sc = 1.55e-5/6.1e-6; ok = (Re > 2 && Re < 800) && (Sc > 0.6 && Sc < 2.7);
    Sh = 2 + 0.552*sqrt(Re)*Sc^(1/3); kc = Sh*6.1e-6/0.01; N = kc*10.4/(8.314*298.15);
    fprintf('[2] Naphthalene sphere d = 1 cm in air at 1 m/s (p* = 10.4 Pa, rho = 1145 kg/m3, M = 0.128 kg/mol)\n');
    if ok, s = 'yes'; else, s = 'no'; end
    fprintf('   Re = %.1f, Sc = %.3f, inside Frossling range: %s\n', Re, Sc, s);
    fprintf('   Sh = %.2f, k_c = %.4e m/s, N = %.4e mol/m2 s, dR/dt = %.3e m/s (%.3f mm/day)\n', Sh, kc, N, N*0.128/1145, N*0.128/1145*86400e3);
    Sh6 = 2 + 0.6*sqrt(Re)*Sc^(1/3);
    fprintf('   with coefficient 0.6 instead: Sh = %.2f (x%.3f)\n\n', Sh6, Sh6/Sh);
    Re = 5e4; Sc = 500; ShCC = 0.023*Re^0.8*Sc^(1/3); ShR = 0.023*Re^(-0.2)*Re*Sc;
    fprintf('[3] Liquid in a 2 cm pipe, Re = 5e4, Sc = 500\n');
    fprintf('   Chilton-Colburn Sh = %.1f, k_c = %.3e m/s; Reynolds analogy Sh = %.3e (ratio %.1f = Sc^(2/3) = %.1f)\n', ShCC, ShCC*1.2e-9/0.02, ShR, ShR/ShCC, Sc^(2/3));
    fprintf('   bubble column: k_c ratio 1.41 for D ratio 2 -> exponent %.3f\n\n', log(1.41)/log(2));
    ky = 1e-3; kx = 5e-3; m = 30; y = 0.05; x = 0.001; Ky = 1/(1/ky + m/kx); Nf = Ky*(y - m*x);
    fprintf('[4] Two films: ky = %.0e, kx = %.0e, m = %.0f, y = %.3f, x = %.3f\n', ky, kx, m, y, x);
    fprintf('   Ky = %.4e, N = %.4e, yi = %.4f, xi = %.4e, gas-film share = %.1f%%\n\n', Ky, Nf, y - Nf/ky, x + Nf/kx, 100*(1/ky)/(1/ky + m/kx));
    yb = 0.02; ya = yb*0.1; LVmin = (yb - ya)/yb; A = 1.5*LVmin;
    NTU = log((1 - 1/A)*yb/ya + 1/A)/(1 - 1/A);
    fprintf('[5] Dilute absorber: yb = 0.02, 90%% recovery, m = 1, L/V = 1.5 x minimum, HTU = 0.6 m\n');
    fprintf('   (L/V)min = %.3f, A = %.3f, NTU_OG = %.3f, Z = %.3f m\n', LVmin, A, NTU, 0.6*NTU);
end

function [Re, Sc, Sh, kc, reg] = flat_plate(U, L, nu, D)
    Re = U*L/nu; Sc = nu/D;
    if Re < 2e5, Sh = 0.664*sqrt(Re)*Sc^(1/3); reg = 'laminar';
    else, Sh = 0.0365*Re^0.8*Sc^(1/3); reg = 'turbulent'; end
    kc = Sh*D/L;
end
