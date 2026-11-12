% Week 12 - Topic 2: Integral (von Karman-Pohlhausen) Analysis of the Concentration Boundary Layer
% Lecture (Part 1):
%   * d/dx int_0^delta_c vx (cA_inf - cA) dy = kc (cAs - cA_inf);  cubic ansatz for velocity and concentration
%   * delta_M/x = 4.64/Re_x^(1/2); r = delta_c/delta_M ~ 0.976 Sc^(-1/3); Sh_x ~ 0.331 Sc^(1/3) Re_x^(1/2)
%     (lecture slide quotes 0.36);  turbulent 1/7 law: Sh_x = 0.0292 Re_x^(4/5)
% Run: week12_topic2_integral_method   (MATLAB R2016b or later)

cubic = @(p) 1.5*p - 0.5*p.^3;
fprintf('=== 1. Momentum integral with the cubic profile ===\n');
Hm = simpson(@(p) cubic(p).*(1 - cubic(p)), 0, 1, 2000);
c = sqrt(3/Hm);
fprintf('  momentum thickness / delta = %.5f (= 39/280 = %.5f)\n', Hm, 39/280);
fprintf('  delta_M / x = %.3f / Re_x^(1/2)   (exact Blasius delta_99: 4.91)\n', c);

fprintf('\n=== 2. Concentration integral: r = delta_c/delta_M and Sh_x coefficient ===\n');
fprintf('     Sc       r       r Sc^(1/3)   Sh_x / (Re^(1/2) Sc^(1/3))\n');
G = @(r) simpson(@(p) cubic(r*p).*(1 - cubic(p)), 0, 1, 2000);
for Sc = [1 2 10 100 1000]
    f = @(r) r*G(r)*c^2/2 - 1.5/(r*Sc);
    lo = 1e-4; hi = 1.01;
    for k = 1:80
        mid = 0.5*(lo + hi);
        if f(lo)*f(mid) <= 0, hi = mid; else, lo = mid; end
    end
    r = 0.5*(lo + hi);
    fprintf('  %7.1f   %.4f    %.4f       %.4f\n', Sc, r, r*Sc^(1/3), 1.5/(r*c)/Sc^(1/3));
end
fprintf('  exact (Blasius-Pohlhausen): 0.332; lecture slide: 0.36\n');

fprintf('\n=== 3. Laminar versus turbulent local Sherwood numbers (Sc = 1) ===\n');
for Re = [1e4 1e5 5e5 1e6 1e7]
    fprintf('  Re_x = %8.0e: laminar 0.332 Re^(1/2) = %8.1f,  turbulent 0.0292 Re^(4/5) = %8.1f\n', Re, 0.332*sqrt(Re), 0.0292*Re^0.8);
end
fprintf('  -> at transition (Re_x ~ 5e5) the turbulent law gives about 4.5 times more transfer\n');

fprintf('\n=== 4. Case: naphthalene sublimation from a plate (illustrative properties) ===\n');
nu = 1.55e-5; D = 6.1e-6; v = 2.0; L = 0.10; W = 0.05; psat = 10.6; T = 298.15; M = 0.1282;
Sc = nu/D; ReL = v*L/nu; ShL = 0.664*Sc^(1/3)*sqrt(ReL); kc = ShL*D/L;
cs = psat/(8.314*T); rate = kc*W*L*cs*M;
fprintf('  Sc = %.2f, Re_L = %.0f, Sh_L = %.1f, kc = %.3f cm/s\n', Sc, ReL, ShL, kc*100);
fprintf('  surface concentration = %.2f mmol/m^3; sublimation rate = %.1f mg/h\n', cs*1e3, rate*3.6e9);
fprintf('  surface recession = %.2f um/h (rho = 1145 kg/m^3): measurable by profilometry\n', rate/(1145*W*L)*3.6e9);

function s = simpson(f, a, b, n)
    h = (b - a)/n; x = a + (0:n)*h; w = 2*ones(1, n+1); w(2:2:n) = 4; w([1 end]) = 1;
    s = sum(w.*f(x))*h/3;
end
