% Week 12 - Topic 3: Turbulent Mass Transfer - Reynolds, Prandtl, von Karman and Chilton-Colburn Analogies
% Lecture (Part 2):
%   * eddy diffusivity: N_Ay = -(D_AB + eps_D) dcA/dy;  laminar sublayer delta/D = 62 Re^(-7/8)
%   * Reynolds (Sc = 1): kc/v = Cf/2;  Prandtl: kc/v = (Cf/2)/[1 + 5 sqrt(Cf/2)(Sc - 1)]
%   * von Karman: Sh = (Cf/2) Re Sc / {1 + 5 sqrt(Cf/2)[Sc - 1 + ln((1 + 5Sc)/6)]}
%   * Chilton-Colburn: j_D = (kc/v) Sc^(2/3) = Cf/2  (0.6 < Sc < 2500);  smooth pipe Cf/2 = 0.023 Re^(-0.2)
% Run: week12_topic3_turbulent_analogies   (MATLAB R2016b or later)

hc = @(Re) 0.023*Re.^-0.2;
shR = @(Re, Sc) hc(Re).*Re.*Sc;
shP = @(Re, Sc) hc(Re).*Re.*Sc./(1 + 5*sqrt(hc(Re)).*(Sc - 1));
shK = @(Re, Sc) hc(Re).*Re.*Sc./(1 + 5*sqrt(hc(Re)).*(Sc - 1 + log((1 + 5*Sc)/6)));
shC = @(Re, Sc) hc(Re).*Re.*Sc.^(1/3);
for Re = [1e4 1e5]
    fprintf('=== Smooth pipe, Re = %.0e, Cf/2 = %.5f ===\n', Re, hc(Re));
    fprintf('     Sc    Reynolds    Prandtl   von Karman   Colburn\n');
    for Sc = [0.7 1 2 10 100 1000]
        fprintf('  %6.1f  %9.1f  %9.1f  %9.1f   %9.1f\n', Sc, shR(Re, Sc), shP(Re, Sc), shK(Re, Sc), shC(Re, Sc));
    end
    fprintf('\n');
end
fprintf('  -> all four agree at Sc = 1. Reynolds overshoots at large Sc (it ignores the sublayer resistance);\n');
fprintf('     Prandtl and von Karman level off (they allow no eddy transport inside the sublayer),\n');
fprintf('     while Colburn keeps the Sc^(1/3) growth seen in liquid-phase data within 0.6 < Sc < 2500\n');

fprintf('\n=== Laminar sublayer thickness, delta/D = 62 Re^(-7/8) ===\n');
for Re = [1e4 3e4 1e5 3e5]
    d = 62*Re^-0.875;
    fprintf('  Re = %7.0e: delta/D = %.5f  -> in a 25 mm pipe: %.0f um\n', Re, d, d*25e3);
end

fprintf('\n=== Case: wall dissolution in a water pipe (Sc = 1000, Re = 2e4, D = 1e-9 m^2/s, d = 25 mm) ===\n');
Re = 2e4; Sc = 1000; D = 1e-9; d = 0.025;
names = {'Prandtl', 'von Karman', 'Colburn'}; sh = [shP(Re, Sc) shK(Re, Sc) shC(Re, Sc)];
for i = 1:3
    fprintf('  %-10s: Sh = %7.1f, kc = %.2f um/s\n', names{i}, sh(i), sh(i)*D/d*1e6);
end
fprintf('  -> a factor of ~3 between models at Sc = 1000: for liquids, use a Sc^(1/3) correlation\n');
